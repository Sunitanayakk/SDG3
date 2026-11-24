"""Idempotent operator-reviewed navigation sources. No patient or usage fixtures."""

import asyncio
import json
from pathlib import Path

from sqlalchemy import select

from app.core.config import settings
from app.database.seed import RESOURCE_DATA
from app.database.session import SessionLocal
from app.models.entities import Chunk, Document, KnowledgeSource, Resource, SafetyCase
from app.rag.pipeline import index_document
from app.services.safety import CASES

SOURCES = [
    (
        "who-activity",
        "Physical activity and disability",
        "World Health Organization",
        "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
        "who-physical-activity.md",
        "Health education",
    ),
    (
        "who-diet",
        "General principles of a healthy diet",
        "World Health Organization",
        "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
        "who-healthy-diet.md",
        "Health education",
    ),
    (
        "who-blood-pressure",
        "Understanding high blood pressure",
        "World Health Organization",
        "https://www.who.int/news-room/fact-sheets/detail/hypertension",
        "who-blood-pressure.md",
        "Health education",
    ),
    (
        "esanjeevani",
        "eSanjeevani service navigation",
        "MoHFW / C-DAC",
        "https://esanjeevani.mohfw.gov.in/",
        "official-service-guide.md",
        "Service navigation",
    ),
    (
        "india-emergency",
        "India emergency service navigation",
        "Ministry of Home Affairs",
        "https://www.mha.gov.in/emergency-response-support-system-erss",
        "india-emergency-navigation.md",
        "Safety",
    ),
    (
        "odisha-ambulance",
        "Odisha ambulance navigation",
        "National Health Mission Odisha",
        "https://nhmodisha.gov.in/patient_transport_2/",
        "odisha-ambulance-navigation.md",
        "Service navigation",
    ),
]


async def main():
    if settings().demo_mode:
        raise RuntimeError("Reference bootstrap requires real mode")
    indexed = []
    with SessionLocal() as db:
        for key, title, organization, url, filename, category in SOURCES:
            source_id, doc_id = "official-source-" + key, "official-doc-" + key
            source = db.get(KnowledgeSource, source_id)
            if not source:
                source = KnowledgeSource(
                    id=source_id, title=title, organization=organization, url=url, verified=True
                )
                db.add(source)
                db.flush()
            doc = db.get(Document, doc_id)
            if not doc:
                content = (Path(__file__).resolve().parents[1] / "examples" / filename).read_text(
                    encoding="utf-8"
                )
                doc = Document(
                    id=doc_id,
                    source_id=source_id,
                    title=title,
                    category=category,
                    language="en",
                    content=content,
                    synthetic=False,
                )
                db.add(doc)
                db.commit()
            model = db.scalar(select(Chunk.embedding_model).where(Chunk.document_id == doc_id).limit(1))
            if doc.status != "indexed" or model != settings().embedding_model:
                await index_document(db, doc)
            indexed.append({"document_id": doc.id, "status": doc.status})
        for i, values in enumerate(RESOURCE_DATA[:5]):
            ident = f"official-resource-{i + 1:02}"
            if not db.get(Resource, ident):
                fields = ["name", "type", "description", "notes", "url", "verified", "phone"]
                db.add(Resource(id=ident, **dict(zip(fields, values, strict=True))))
        for i, (question, language, expected, category) in enumerate(CASES):
            ident = f"safety-{i + 1:02}"
            if not db.get(SafetyCase, ident):
                db.add(
                    SafetyCase(
                        id=ident, question=question, language=language, expected=expected, category=category
                    )
                )
        db.commit()
    print(
        json.dumps(
            {
                "status": "ok",
                "indexed_sources": indexed,
                "embedding_model": settings().embedding_model,
                "embedding_dimensions": settings().embedding_dimensions,
                "resource_entries": 5,
                "safety_definitions": len(CASES),
                "patient_or_analytics_fixtures_created": False,
            }
        )
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        print(
            json.dumps(
                {
                    "status": "failed",
                    "error_type": type(exc).__name__,
                    "details": "Private connection diagnostics suppressed",
                }
            )
        )
        raise SystemExit(1) from None
