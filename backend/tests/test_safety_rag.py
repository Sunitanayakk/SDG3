import asyncio

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.models.entities import Chunk, Document, KnowledgeSource
from app.rag.embeddings import validate
from app.rag.pipeline import chunk_text, grounded_citations, retrieve
from app.services.safety import CASES, classify


@pytest.mark.parametrize("question,language,expected,category", CASES)
def test_supported_safety_examples(question, language, expected, category):
    assert classify(question) == expected


def test_emergency_bypasses_provider(client, monkeypatch):
    def fail():
        raise AssertionError("Emergency must never reach model")

    monkeypatch.setattr("app.services.chat.NvidiaProvider", fail)
    result = client.post("/api/v1/chat", json={"message": "I cannot breathe", "language": "en"}).json()
    assert result["safety_level"] == "emergency" and "112" in result["reply"]
    assert result["citations"] == []


def test_chunk_overlap():
    chunks = chunk_text("abcdefghijklmnopqrstuvwxyz", 10, 3)
    assert chunks[0][-3:] == chunks[1][:3]
    assert chunks[-1].endswith("z")


def test_citation_validation():
    hits = [
        {
            "source_id": "official-1",
            "title": "Approved source",
            "url": "https://example.org",
            "verified": True,
        }
    ]
    assert grounded_citations("Supported statement [S1]", hits)[1][0]["source_id"] == "official-1"
    assert grounded_citations("Unsupported [S9]", hits)[1] == []
    assert grounded_citations("No citations", hits)[1] == []


def test_semantic_retrieval_and_approval_boundary(db):
    dim = settings().embedding_dimensions
    for i, verified in enumerate([True, True, False]):
        source = KnowledgeSource(title="Approved " + str(i), url="https://example.org", verified=verified)
        db.add(source)
        db.flush()
        doc = Document(
            source_id=source.id,
            title=source.title,
            content="Navigation guide",
            status="indexed",
            synthetic=False,
        )
        db.add(doc)
        db.flush()
        vector = [0.0] * dim
        vector[i] = 1.0
        db.add(
            Chunk(
                document_id=doc.id,
                ordinal=0,
                content="Online doctor service access" if i == 0 else "Other subject",
                embedding=vector,
                embedding_model=settings().embedding_model,
            )
        )
    db.commit()

    class FakeEmbeddings:
        async def embed(self, texts, query=False):
            return [[1.0] + [0.0] * (dim - 1)]

    hits = asyncio.run(retrieve(db, "online doctor", 4, FakeEmbeddings()))
    assert len(hits) == 1
    assert hits[0]["snippet"] == "Online doctor service access" and hits[0]["score"] == 1


def test_embedding_dimension_validation():
    with pytest.raises(HTTPException):
        validate([[1, 2]], 1)


def test_missing_evidence_does_not_call_llm(client, monkeypatch):
    async def empty(*args, **kwargs):
        return []

    def fail():
        raise AssertionError("No evidence must not call model")

    monkeypatch.setattr(settings(), "demo_mode", False)
    monkeypatch.setattr("app.services.chat.retrieve", empty)
    monkeypatch.setattr("app.services.chat.NvidiaProvider", fail)
    result = client.post("/api/v1/chat", json={"message": "Uncovered topic"}).json()
    assert result["mode"] == "real" and result["citations"] == []
    assert "enough verified evidence" in result["reply"]
