from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import HttpUrl, TypeAdapter
from sqlalchemy import delete, select, text
from sqlalchemy.orm import Session

from app.ai.provider import NvidiaProvider
from app.core.auth import admin, demo_login, principal, require_user
from app.core.config import settings
from app.core.rate_limit import limit
from app.database.session import get_db
from app.models.entities import (
    ChatSession,
    Document,
    Feedback,
    KnowledgeSource,
    Message,
    Preference,
    Resource,
    SafetyCase,
    SafetyRun,
    Usage,
    User,
)
from app.rag.pipeline import extract, index_document
from app.repositories.queries import document_dict, overview, record_dict
from app.schemas.contracts import ChatRequest, FeedbackRequest, Preferences, ResourceRequest
from app.services.chat import respond
from app.services.safety import classify

router = APIRouter()
DB = Annotated[Session, Depends(get_db)]
Admin = Annotated[User, Depends(admin)]
Member = Annotated[User, Depends(require_user)]
Page = Annotated[int, Query(ge=1)]
Size = Annotated[int, Query(ge=1, le=100)]


def get_or_404(db, model, ident):
    item = db.get(model, ident)
    if item is None:
        raise HTTPException(404, "Record not found")
    return item


@router.get("/health")
def health(db: DB):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "mode": "demo" if settings().demo_mode else "real", "provider": "not_checked"}


@router.get("/api/v1/config/public")
def public_config():
    return {
        "demo_mode": settings().demo_mode,
        "provider_connected": False,
        "model": settings().nvidia_model,
        "persistence_default": False,
        "translation_validated": False,
    }


@router.post("/api/v1/auth/demo", dependencies=[Depends(limit)])
def demo_auth(db: DB, role: str = Query(default="patient", pattern="^(admin|patient)$")):
    return demo_login(db, role == "admin")


@router.post("/api/v1/chat", dependencies=[Depends(limit)])
async def chat(req: ChatRequest, db: DB, user: User | None = Depends(principal)):
    return await respond(db, req, user)


@router.get("/api/v1/chat/sessions")
def sessions(db: DB, user: Member, page: Page = 1, page_size: Size = 30):
    return [
        record_dict(r)
        for r in db.scalars(
            select(ChatSession)
            .where(ChatSession.user_id == user.id)
            .order_by(ChatSession.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ]


@router.get("/api/v1/chat/sessions/{ident}")
def session_detail(ident: str, db: DB, user: Member):
    item = get_or_404(db, ChatSession, ident)
    if item.user_id != user.id:
        raise HTTPException(404, "Session not found")
    return {
        **record_dict(item),
        "messages": [
            record_dict(r)
            for r in db.scalars(
                select(Message).where(Message.session_id == ident).order_by(Message.created_at)
            )
        ],
    }


@router.delete("/api/v1/chat/sessions/{ident}", status_code=204)
def delete_session(ident: str, db: DB, user: Member):
    item = get_or_404(db, ChatSession, ident)
    if item.user_id != user.id:
        raise HTTPException(404, "Session not found")
    db.delete(item)
    db.commit()


@router.get("/api/v1/health-resources")
def resources(db: DB, q: str = "", page: Page = 1, page_size: Size = 100):
    return [
        record_dict(r)
        for r in db.scalars(
            select(Resource)
            .where(Resource.name.ilike(f"%{q[:100]}%"))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ]


@router.get("/api/v1/health-resources/{ident}")
def resource(ident: str, db: DB):
    return record_dict(get_or_404(db, Resource, ident))


@router.post("/api/v1/feedback", status_code=201, dependencies=[Depends(limit)])
def feedback(req: FeedbackRequest, db: DB):
    item = Feedback(**req.model_dump(), synthetic=settings().demo_mode)
    db.add(item)
    db.commit()
    return record_dict(item)


@router.get("/api/v1/languages")
def languages():
    return [{"id": "en", "name": "English"}, {"id": "hi", "name": "हिन्दी"}, {"id": "or", "name": "ଓଡ଼ିଆ"}]


@router.get("/api/v1/preferences")
def get_preferences(db: DB, user: Member):
    item = db.scalar(select(Preference).where(Preference.user_id == user.id))
    return item.values if item else Preferences(display_name=user.display_name).model_dump()


@router.put("/api/v1/preferences")
def save_preferences(req: Preferences, db: DB, user: Member):
    item = db.scalar(select(Preference).where(Preference.user_id == user.id))
    if not item:
        item = Preference(user_id=user.id)
        db.add(item)
    item.values = req.model_dump()
    db.commit()
    return item.values


@router.get("/api/v1/admin/overview")
def admin_overview(db: DB, user: Admin):
    return overview(db)


@router.get("/api/v1/admin/documents")
def documents(
    db: DB,
    user: Admin,
    q: str = "",
    language: str = "",
    category: str = "",
    page: Page = 1,
    page_size: Size = 100,
):
    query = select(Document).where(Document.title.ilike(f"%{q[:100]}%"))
    if language:
        query = query.where(Document.language == language)
    if category:
        query = query.where(Document.category == category)
    return [
        document_dict(db, d)
        for d in db.scalars(
            query.order_by(Document.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
    ]


@router.post("/api/v1/admin/documents", status_code=201)
async def upload(
    db: DB,
    user: Admin,
    file: UploadFile = File(...),
    title: str = Form(..., min_length=2, max_length=200),
    category: str = Form("General", max_length=80),
    language: str = Form("en", pattern="^(en|hi|or)$"),
    url: str = Form("", max_length=1000),
    organization: str = Form("", max_length=200),
    verified: bool = Form(False),
    publication_date: str = Form("", max_length=30),
):
    if url:
        try:
            url = str(TypeAdapter(HttpUrl).validate_python(url))
        except ValueError:
            raise HTTPException(422, "Source URL must be HTTP or HTTPS") from None
    if verified and (not url or not organization):
        raise HTTPException(422, "Approved sources need an official URL and organization")
    content = extract(file.filename or "", await file.read(settings().max_upload_bytes + 1))
    source = KnowledgeSource(
        title=title,
        url=url or None,
        organization=organization or "Unreviewed upload",
        verified=verified and not settings().demo_mode,
        publication_date=publication_date or None,
    )
    db.add(source)
    db.flush()
    doc = Document(
        title=title,
        category=category,
        language=language,
        source_id=source.id,
        content=content,
        synthetic=settings().demo_mode,
    )
    db.add(doc)
    db.commit()
    return document_dict(db, doc)


@router.get("/api/v1/admin/documents/{ident}")
def document_detail(ident: str, db: DB, user: Admin):
    doc = get_or_404(db, Document, ident)
    return {**document_dict(db, doc), "content": doc.content}


@router.delete("/api/v1/admin/documents/{ident}", status_code=204)
def remove_document(ident: str, db: DB, user: Admin):
    doc = get_or_404(db, Document, ident)
    source_id = doc.source_id
    db.delete(doc)
    db.flush()
    if not db.scalar(select(Document).where(Document.source_id == source_id)):
        db.execute(delete(KnowledgeSource).where(KnowledgeSource.id == source_id))
    db.commit()


@router.post("/api/v1/admin/documents/{ident}/index")
async def index(ident: str, db: DB, user: Admin):
    doc = get_or_404(db, Document, ident)
    await index_document(db, doc)
    return document_dict(db, doc)


@router.post("/api/v1/admin/ai/test", dependencies=[Depends(limit)])
async def test_ai(req: ChatRequest, db: DB, user: Admin):
    return await respond(db, req, user, technical=True)


@router.post("/api/v1/admin/ai/health", dependencies=[Depends(limit)])
async def provider_health(user: Admin):
    if settings().demo_mode:
        return {"provider_connected": False, "mode": "demo"}
    await NvidiaProvider().generate("Reply with the word ready.", "en", "[S1] This is a connection test.")
    return {"provider_connected": True, "mode": "real"}


@router.get("/api/v1/admin/analytics")
def analytics(db: DB, user: Admin, language: str = "", start: date | None = None, end: date | None = None):
    rows = db.scalars(select(Usage).order_by(Usage.created_at)).all()
    counts = {}
    for row in rows:
        day = row.created_at.date()
        if (language and row.language != language) or (start and day < start) or (end and day > end):
            continue
        key = (str(day), row.language)
        counts.setdefault(
            key, {"date": str(day), "language": row.language, "queries": 0, "retrieved": 0, "feedback": 0}
        )
        counts[key]["queries"] += 1
        counts[key]["retrieved"] += int(row.retrieved)
    for row in db.scalars(select(Feedback)):
        day = row.created_at.date()
        if (language and row.language != language) or (start and day < start) or (end and day > end):
            continue
        key = (str(day), row.language)
        counts.setdefault(
            key, {"date": str(day), "language": row.language, "queries": 0, "retrieved": 0, "feedback": 0}
        )
        counts[key]["feedback"] += 1
    return {"rows": list(counts.values()), "data_type": overview(db)["data_type"]}


@router.get("/api/v1/admin/feedback")
def list_feedback(db: DB, user: Admin, page: Page = 1, page_size: Size = 100):
    return [
        record_dict(f)
        for f in db.scalars(
            select(Feedback)
            .order_by(Feedback.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ]


@router.get("/api/v1/admin/safety-tests")
def safety_tests(db: DB, user: Admin):
    result = []
    for case in db.scalars(select(SafetyCase)):
        run = db.scalar(
            select(SafetyRun).where(SafetyRun.case_id == case.id).order_by(SafetyRun.created_at.desc())
        )
        result.append(
            {
                **record_dict(case),
                "actual": run.actual if run else None,
                "passed": run.passed if run else None,
                "scope": "Deterministic rule classification only",
            }
        )
    return result


@router.post("/api/v1/admin/safety-tests/run")
def run_safety(db: DB, user: Admin):
    for case in db.scalars(select(SafetyCase)):
        actual = classify(case.question)
        db.add(SafetyRun(case_id=case.id, actual=actual, passed=actual == case.expected))
    db.commit()
    return safety_tests(db, user)


@router.get("/api/v1/admin/resources")
def admin_resources(db: DB, user: Admin, page: Page = 1, page_size: Size = 100):
    return resources(db, page=page, page_size=page_size)


@router.post("/api/v1/admin/resources", status_code=201)
def add_resource(req: ResourceRequest, db: DB, user: Admin):
    row = Resource(**req.model_dump(mode="json"))
    db.add(row)
    db.commit()
    return record_dict(row)


@router.put("/api/v1/admin/resources/{ident}")
def update_resource(ident: str, req: ResourceRequest, db: DB, user: Admin):
    row = get_or_404(db, Resource, ident)
    for k, v in req.model_dump(mode="json").items():
        setattr(row, k, v)
    db.commit()
    return record_dict(row)


@router.delete("/api/v1/admin/resources/{ident}", status_code=204)
def delete_resource(ident: str, db: DB, user: Admin):
    db.delete(get_or_404(db, Resource, ident))
    db.commit()
