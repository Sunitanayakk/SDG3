"""Run from backend: python -m scripts.manage seed|reset-demo|grant-admin|ingest."""

import argparse
import asyncio
from pathlib import Path

from sqlalchemy import select

from app.core.config import settings
from app.database.seed import seed
from app.database.session import Base, SessionLocal, engine
from app.models.entities import Document, KnowledgeSource, Role, SafetyCase, User
from app.rag.pipeline import extract, index_document
from app.services.safety import CASES

parser = argparse.ArgumentParser()
parser.add_argument("action", choices=["seed", "reset-demo", "grant-admin", "ingest", "init-safety"])
parser.add_argument("--user-id")
parser.add_argument("--file")
parser.add_argument("--title", default="Reviewed source")
parser.add_argument("--url")
parser.add_argument("--organization")
args = parser.parse_args()
with SessionLocal() as db:
    if args.action in {"seed", "reset-demo"}:
        if not settings().demo_mode:
            parser.error("Synthetic fixture commands are disabled in real mode")
        if args.action == "reset-demo":
            Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        seed(db)
    elif args.action == "init-safety":
        for i, (question, language, expected, category) in enumerate(CASES):
            ident = f"safety-{i + 1:02}"
            if not db.get(SafetyCase, ident):
                db.add(
                    SafetyCase(
                        id=ident, question=question, language=language, expected=expected, category=category
                    )
                )
        db.commit()
    elif args.action == "grant-admin":
        if settings().demo_mode or not args.user_id:
            parser.error("Requires real mode and a Supabase user UUID")
        if not db.get(User, args.user_id):
            db.add(User(id=args.user_id, display_name="Administrator"))
            db.flush()
        if not db.scalar(select(Role).where(Role.user_id == args.user_id, Role.name == "admin")):
            db.add(Role(user_id=args.user_id, name="admin"))
        db.commit()
    else:
        if not all([args.file, args.url, args.organization]):
            parser.error("ingest requires --file --url --organization; operator must review source first")
        from pydantic import HttpUrl, TypeAdapter

        url = str(TypeAdapter(HttpUrl).validate_python(args.url))
        path = Path(args.file)
        content = extract(path.name, path.read_bytes())
        source = KnowledgeSource(
            title=args.title, url=url, organization=args.organization, verified=not settings().demo_mode
        )
        db.add(source)
        db.flush()
        doc = Document(title=args.title, source_id=source.id, content=content, synthetic=settings().demo_mode)
        db.add(doc)
        db.commit()
        asyncio.run(index_document(db, doc))
        print(f"Indexed document {doc.id}; mode={'demo' if settings().demo_mode else 'real'}")
