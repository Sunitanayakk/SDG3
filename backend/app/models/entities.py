from datetime import datetime, timezone
from uuid import uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.config import settings
from app.database.session import Base


def uid():
    return str(uuid4())


def now():
    return datetime.now(timezone.utc)


class Identity:
    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=uid)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class User(Identity, Base):
    __tablename__ = "users"
    display_name: Mapped[str] = mapped_column(String(80), default="Guest")
    synthetic: Mapped[bool] = mapped_column(Boolean, default=False)


class Role(Identity, Base):
    __tablename__ = "roles"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(30))
    __table_args__ = (UniqueConstraint("user_id", "name"),)


class Preference(Identity, Base):
    __tablename__ = "user_preferences"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    values: Mapped[dict] = mapped_column(JSON, default=dict)


class ChatSession(Identity, Base):
    __tablename__ = "chat_sessions"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(100))
    language: Mapped[str] = mapped_column(String(5), default="en")


class Message(Identity, Base):
    __tablename__ = "chat_messages"
    session_id: Mapped[str] = mapped_column(ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    citations: Mapped[list] = mapped_column(JSON, default=list)


class KnowledgeSource(Identity, Base):
    __tablename__ = "knowledge_sources"
    title: Mapped[str] = mapped_column(String(200))
    organization: Mapped[str] = mapped_column(String(200), default="Synthetic demonstration")
    url: Mapped[str | None] = mapped_column(String(1000))
    publication_date: Mapped[str | None] = mapped_column(String(30))
    verified: Mapped[bool] = mapped_column(Boolean, default=False)


class Document(Identity, Base):
    __tablename__ = "knowledge_documents"
    source_id: Mapped[str] = mapped_column(ForeignKey("knowledge_sources.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(80), default="General")
    language: Mapped[str] = mapped_column(String(5), default="en")
    content: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="uploaded")
    error: Mapped[str | None] = mapped_column(String(200))
    synthetic: Mapped[bool] = mapped_column(Boolean, default=False)


class Chunk(Identity, Base):
    __tablename__ = "document_chunks"
    document_id: Mapped[str] = mapped_column(
        ForeignKey("knowledge_documents.id", ondelete="CASCADE"), index=True
    )
    ordinal: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list] = mapped_column(
        Vector(settings().embedding_dimensions).with_variant(JSON, "sqlite")
    )
    embedding_model: Mapped[str] = mapped_column(String(200))


class Resource(Identity, Base):
    __tablename__ = "healthcare_resources"
    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(60))
    description: Mapped[str] = mapped_column(Text)
    notes: Mapped[str] = mapped_column(Text)
    url: Mapped[str] = mapped_column(String(1000))
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    phone: Mapped[str | None] = mapped_column(String(20))


class Feedback(Identity, Base):
    __tablename__ = "feedback"
    rating: Mapped[int] = mapped_column(Integer)
    message: Mapped[str] = mapped_column(String(2000))
    language: Mapped[str] = mapped_column(String(5), default="en")
    synthetic: Mapped[bool] = mapped_column(Boolean, default=False)


class Usage(Identity, Base):
    __tablename__ = "ai_usage_events"
    language: Mapped[str] = mapped_column(String(5))
    retrieved: Mapped[bool] = mapped_column(Boolean)
    latency_ms: Mapped[float] = mapped_column(Float)
    synthetic: Mapped[bool] = mapped_column(Boolean, default=False)


class SafetyCase(Identity, Base):
    __tablename__ = "safety_test_cases"
    question: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(5))
    expected: Mapped[str] = mapped_column(String(30))
    category: Mapped[str] = mapped_column(String(80))


class SafetyRun(Identity, Base):
    __tablename__ = "safety_test_runs"
    case_id: Mapped[str] = mapped_column(ForeignKey("safety_test_cases.id", ondelete="CASCADE"), index=True)
    actual: Mapped[str] = mapped_column(String(30))
    passed: Mapped[bool] = mapped_column(Boolean)
