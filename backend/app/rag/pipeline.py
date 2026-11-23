import re

import pymupdf
from fastapi import HTTPException
from pgvector.sqlalchemy import HALFVEC
from sqlalchemy import cast, delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import Chunk, Document, KnowledgeSource
from app.rag.embeddings import embedding_provider


def extract(filename: str, content: bytes) -> str:
    extension = filename.rsplit(".", 1)[-1].lower()
    if extension not in {"pdf", "txt", "md"}:
        raise HTTPException(415, "Only PDF, TXT and Markdown files are supported")
    if not content or len(content) > settings().max_upload_bytes:
        raise HTTPException(413, "File must be nonempty and at most 5 MB")
    try:
        if extension == "pdf":
            if not content.startswith(b"%PDF-"):
                raise ValueError("Invalid PDF signature")
            with pymupdf.open(stream=content, filetype="pdf") as doc:
                if doc.is_encrypted or len(doc) > 150:
                    raise ValueError("Encrypted or oversized PDF")
                text = "\n".join(page.get_text() for page in doc)
        else:
            text = content.decode("utf-8-sig")
            if "\x00" in text:
                raise ValueError("Binary file")
        text = re.sub(r"[ \t]+", " ", text).strip()
        if len(text) < 20 or len(text) > 500_000:
            raise ValueError("Text must contain 20..500000 characters; scanned PDFs need OCR")
        return text
    except Exception:
        raise HTTPException(422, "Could not extract safe readable text from this file") from None


def chunk_text(text: str, size: int = 900, overlap: int = 150) -> list[str]:
    if overlap >= size or overlap < 0:
        raise ValueError("Invalid overlap")
    return [text[i : i + size] for i in range(0, len(text), size - overlap)]


async def index_document(db: Session, doc: Document, provider=None):
    doc.status = "indexing"
    db.commit()
    try:
        texts = chunk_text(doc.content)
        if settings().demo_mode:
            vectors = [[0.0] * settings().embedding_dimensions for _ in texts]
            model = "synthetic-demo-no-semantic-embedding"
        else:
            source = db.get(KnowledgeSource, doc.source_id)
            if not source.verified:
                raise HTTPException(422, "Review and approve the source before real indexing")
            vectors = []
            for start in range(0, len(texts), 32):
                vectors.extend(await (provider or embedding_provider()).embed(texts[start : start + 32]))
            model = settings().embedding_model
        db.execute(delete(Chunk).where(Chunk.document_id == doc.id))
        for i, (text, vector) in enumerate(zip(texts, vectors, strict=True)):
            db.add(
                Chunk(document_id=doc.id, ordinal=i, content=text, embedding=vector, embedding_model=model)
            )
        doc.status, doc.error = "indexed", None
        db.commit()
    except Exception:
        db.rollback()
        doc = db.get(Document, doc.id)
        doc.status, doc.error = "failed", "Indexing failed; check provider configuration and source approval."
        db.commit()
        raise


async def retrieve(db: Session, question: str, top_k: int, provider=None) -> list[dict]:
    vector = (await (provider or embedding_provider()).embed([question], query=True))[0]
    if db.bind.dialect.name == "postgresql":
        column = (
            cast(Chunk.embedding, HALFVEC(settings().embedding_dimensions))
            if settings().embedding_dimensions > 2000
            else Chunk.embedding
        )
        distance = column.cosine_distance(vector)
        rows = db.execute(
            select(Chunk, Document, KnowledgeSource, distance.label("distance"))
            .join(Document, Document.id == Chunk.document_id)
            .join(KnowledgeSource, KnowledgeSource.id == Document.source_id)
            .where(
                Document.status == "indexed",
                KnowledgeSource.verified.is_(True),
                Document.synthetic.is_(False),
                Chunk.embedding_model == settings().embedding_model,
            )
            .order_by(distance)
            .limit(top_k)
        ).all()
    else:
        # Only for isolated retrieval tests/local development. Real application requires PostgreSQL.
        import math

        rows = []
        for chunk, doc, source in db.execute(
            select(Chunk, Document, KnowledgeSource)
            .join(Document, Document.id == Chunk.document_id)
            .join(KnowledgeSource, KnowledgeSource.id == Document.source_id)
            .where(
                Document.status == "indexed",
                Document.synthetic.is_(False),
                KnowledgeSource.verified.is_(True),
                Chunk.embedding_model == settings().embedding_model,
            )
        ):
            norm = math.sqrt(sum(x * x for x in vector) * sum(x * x for x in chunk.embedding))
            distance = (
                1 - sum(x * y for x, y in zip(vector, chunk.embedding, strict=True)) / norm if norm else 1
            )
            rows.append((chunk, doc, source, distance))
        rows = sorted(rows, key=lambda r: r[3])[:top_k]
    return [
        {
            "source_id": source.id,
            "title": source.title,
            "url": source.url,
            "verified": source.verified,
            "snippet": chunk.content,
            "score": round(1 - float(distance), 4),
        }
        for chunk, doc, source, distance in rows
        if float(distance) < 0.75
    ]


def grounded_citations(answer: str, hits: list[dict]):
    indices = {int(i) - 1 for i in re.findall(r"\[S(\d+)\]", answer)}
    if not indices or any(i < 0 or i >= len(hits) for i in indices):
        return (
            "I do not have enough supported evidence to answer safely. Please consult a qualified professional.",
            [],
        )
    return answer, [{**hits[i], "label": f"S{i + 1}"} for i in sorted(indices)]
