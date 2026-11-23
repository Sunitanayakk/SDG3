from sqlalchemy import func, select

from app.models.entities import Document, Feedback, KnowledgeSource, SafetyCase, SafetyRun, Usage


def document_dict(db, doc):
    source = db.get(KnowledgeSource, doc.source_id)
    return {
        "id": doc.id,
        "title": doc.title,
        "category": doc.category,
        "language": doc.language,
        "status": doc.status,
        "error": doc.error,
        "synthetic": doc.synthetic,
        "source_id": source.id,
        "url": source.url,
        "organization": source.organization,
        "verified": source.verified,
        "publication_date": source.publication_date,
        "created_at": doc.created_at.isoformat(),
    }


def record_dict(record):
    return {
        c.name: (
            getattr(record, c.name).isoformat()
            if hasattr(getattr(record, c.name), "isoformat")
            else getattr(record, c.name)
        )
        for c in record.__table__.columns
    }


def overview(db):
    def count(model):
        return db.scalar(select(func.count()).select_from(model)) or 0

    runs = db.scalars(select(SafetyRun).order_by(SafetyRun.created_at.desc()).limit(count(SafetyCase))).all()
    total = count(Usage)
    retrieved = db.scalar(select(func.count()).select_from(Usage).where(Usage.retrieved.is_(True))) or 0
    return {
        "total_queries": total,
        "indexed_documents": db.scalar(
            select(func.count()).select_from(Document).where(Document.status == "indexed")
        )
        or 0,
        "languages_supported": 3,
        "feedback_submissions": count(Feedback),
        "retrieval_success_rate": round(100 * retrieved / total, 1) if total else 0,
        "safety_test_pass_rate": round(100 * sum(r.passed for r in runs) / len(runs), 1) if runs else None,
        "data_type": "synthetic_demo"
        if __import__("app.core.config", fromlist=["settings"]).settings().demo_mode
        else "aggregate_usage",
    }
