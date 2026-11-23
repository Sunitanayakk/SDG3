"""Exercise real Supabase Auth, API authorization, embeddings, pgvector and MiniMax.

Uses the requested admin's ignored local credentials and one disposable synthetic
patient account. Tokens/passwords and generated reasoning are never printed.
"""

import asyncio
import json
import re
import secrets
from pathlib import Path
from uuid import uuid4

import httpx
from dotenv import dotenv_values
from sqlalchemy import select

from app.core.config import settings
from app.core.rate_limit import _windows
from app.database.session import SessionLocal
from app.main import app
from app.models.entities import Feedback, Preference, User


async def main():
    cfg = settings()
    if cfg.demo_mode:
        raise RuntimeError("Live workflow verification requires real mode")
    creds = dotenv_values(Path(__file__).resolve().parents[1] / ".env.admin.local")
    if not creds.get("SUPABASE_ADMIN_PASSWORD"):
        raise RuntimeError("Local administrator credentials are unavailable")
    _windows.clear()
    results = []

    def record(result):
        results.append(result)
        print(json.dumps(result, ensure_ascii=True), flush=True)

    with SessionLocal() as db:
        had_preferences = (
            db.scalar(select(Preference).where(Preference.user_id == creds["SUPABASE_ADMIN_USER_ID"]))
            is not None
        )
    stage = "start"
    disposable_id, saved_session, temporary_doc, temporary_resource, feedback_id = (
        None,
        None,
        None,
        None,
        None,
    )
    auth_headers = {
        "apikey": cfg.supabase_service_role_key,
        "Authorization": "Bearer " + cfg.supabase_service_role_key,
    }
    public_headers = {"apikey": cfg.supabase_anon_key}
    async with httpx.AsyncClient(base_url=cfg.supabase_url.rstrip("/"), timeout=30) as auth:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://live-test", timeout=180
        ) as api:
            admin_headers = {}
            try:
                stage = "Supabase admin password login"
                login = await auth.post(
                    "/auth/v1/token?grant_type=password",
                    headers=public_headers,
                    json={
                        "email": creds["SUPABASE_ADMIN_EMAIL"],
                        "password": creds["SUPABASE_ADMIN_PASSWORD"],
                    },
                )
                assert login.status_code == 200, "Supabase login failed"
                admin_headers = {"Authorization": "Bearer " + login.json()["access_token"]}
                stage = "verified JWT and administrator access"
                overview = await api.get("/api/v1/admin/overview", headers=admin_headers)
                assert overview.status_code == 200, "Real administrator endpoint did not accept verified JWT"
                assert overview.json()["data_type"] == "aggregate_usage"
                assert (await api.get("/api/v1/admin/documents")).status_code == 401
                assert (await api.post("/api/v1/auth/demo?role=admin")).status_code == 404
                record({"test": "real_admin_auth_and_demo_auth_disabled", "passed": True})

                stage = "disposable synthetic patient account"
                patient_email = "smoke-" + uuid4().hex + "@example.com"
                patient_password = secrets.token_urlsafe(36)
                created = await auth.post(
                    "/auth/v1/admin/users",
                    headers=auth_headers,
                    json={
                        "email": patient_email,
                        "password": patient_password,
                        "email_confirm": True,
                        "user_metadata": {"display_name": "Synthetic integration check"},
                    },
                )
                assert created.status_code in (200, 201), "Synthetic test account creation failed"
                disposable_id = created.json()["id"]
                login = await auth.post(
                    "/auth/v1/token?grant_type=password",
                    headers=public_headers,
                    json={"email": patient_email, "password": patient_password},
                )
                assert login.status_code == 200, "Synthetic patient login failed"
                patient_headers = {"Authorization": "Bearer " + login.json()["access_token"]}
                assert (await api.get("/api/v1/admin/overview", headers=patient_headers)).status_code == 403
                record({"test": "patient_cannot_access_admin", "passed": True})

                stage = "public official directory and reviewed document records"
                resources = (await api.get("/api/v1/health-resources")).json()
                assert len(resources) >= 5
                docs = (await api.get("/api/v1/admin/documents", headers=admin_headers)).json()
                assert all(d["verified"] and not d["synthetic"] and d["status"] == "indexed" for d in docs)
                assert len(docs) >= 3
                record({"test": "official_directory_and_live_indexed_sources", "passed": True})

                stage = "real multilingual retrieval and answer generation"
                initial_sessions = (await api.get("/api/v1/chat/sessions", headers=admin_headers)).json()
                for language, question in [
                    ("en", "How can I access a doctor online through eSanjeevani?"),
                    ("hi", "मैं eSanjeevani पर ऑनलाइन डॉक्टर से कैसे बात कर सकता हूँ?"),
                    ("or", "ମୁଁ eSanjeevani ମାଧ୍ୟମରେ ଅନଲାଇନ୍ ଡାକ୍ତରଙ୍କ ସହ କିପରି କଥା ହେବି?"),
                ]:
                    stage = "live RAG language " + language
                    response = await api.post(
                        "/api/v1/chat",
                        headers=admin_headers,
                        json={
                            "message": question,
                            "language": language,
                            "use_rag": True,
                            "top_k": 3,
                        },
                    )
                    assert response.status_code == 200, (
                        "Live chat failed: "
                        + str(response.status_code)
                        + " "
                        + str(response.json().get("error", {}).get("message", ""))[:180]
                    )
                    answer = response.json()
                    assert answer["mode"] == "real" and answer["retrieval"]["used"]
                    assert answer["citations"], "Expected supported official citations"
                    assert all(c["verified"] and c["url"] for c in answer["citations"])
                    assert any(c["source_id"] == "official-source-esanjeevani" for c in answer["citations"])
                    script_present = language == "en" or bool(
                        re.search(
                            r"[\u0900-\u097f]" if language == "hi" else r"[\u0b00-\u0b7f]", answer["reply"]
                        )
                    )
                    assert script_present, "Expected selected-language script in the answer"
                    record(
                        {
                            "test": "live_rag_" + language,
                            "passed": True,
                            "citations": len(answer["citations"]),
                            "retrieved_passages": answer["retrieval"]["document_count"],
                            "language_script_present": script_present,
                            "translation_clinically_validated": False,
                        }
                    )
                assert (
                    await api.get("/api/v1/chat/sessions", headers=admin_headers)
                ).json() == initial_sessions
                record({"test": "chat_not_persisted_without_consent", "passed": True})

                stage = "emergency bypass"
                for language, question in [
                    ("en", "I cannot breathe"),
                    ("hi", "मुझे सांस लेने में तकलीफ है"),
                    ("or", "ମୋତେ ଶ୍ୱାସ ନେବାରେ କଷ୍ଟ ହେଉଛି"),
                ]:
                    response = await api.post(
                        "/api/v1/chat", json={"message": question, "language": language}
                    )
                    assert response.status_code == 200
                    answer = response.json()
                    assert answer["safety_level"] == "emergency" and not answer["retrieval"]["used"]
                record({"test": "multilingual_emergency_bypass", "passed": True})

                stage = "missing evidence refusal"
                response = await api.post(
                    "/api/v1/chat",
                    headers=admin_headers,
                    json={
                        "message": "What is the verified protocol for the fictional ZQ-847 procedure?",
                    },
                )
                assert response.status_code == 200 and response.json()["citations"] == []
                record({"test": "unsupported_question_no_fabricated_citations", "passed": True})

                stage = "consented session ownership"
                response = await api.post(
                    "/api/v1/chat",
                    headers=admin_headers,
                    json={
                        "message": "How can I access eSanjeevani online?",
                        "persist": True,
                    },
                )
                assert response.status_code == 200
                saved_session = response.json()["session_id"]
                assert (
                    await api.get("/api/v1/chat/sessions/" + saved_session, headers=admin_headers)
                ).status_code == 200
                assert (
                    await api.get("/api/v1/chat/sessions/" + saved_session, headers=patient_headers)
                ).status_code == 404
                assert (
                    await api.delete("/api/v1/chat/sessions/" + saved_session, headers=patient_headers)
                ).status_code == 404
                assert (
                    await api.delete("/api/v1/chat/sessions/" + saved_session, headers=admin_headers)
                ).status_code == 204
                saved_session = None
                record({"test": "persisted_chat_ownership_and_delete", "passed": True})

                stage = "real document upload indexing and deletion"
                content = (
                    Path(__file__).resolve().parents[1] / "examples" / "official-service-guide.md"
                ).read_bytes()
                uploaded = await api.post(
                    "/api/v1/admin/documents",
                    headers=admin_headers,
                    data={
                        "title": "Temporary service guide verification",
                        "url": "https://esanjeevani.mohfw.gov.in/",
                        "organization": "MoHFW / C-DAC",
                        "verified": "true",
                    },
                    files={"file": ("guide.md", content, "text/markdown")},
                )
                assert uploaded.status_code == 201
                temporary_doc = uploaded.json()["id"]
                indexed = await api.post(
                    "/api/v1/admin/documents/" + temporary_doc + "/index", headers=admin_headers
                )
                assert indexed.status_code == 200 and indexed.json()["status"] == "indexed"
                assert (
                    await api.delete("/api/v1/admin/documents/" + temporary_doc, headers=admin_headers)
                ).status_code == 204
                temporary_doc = None
                record({"test": "real_upload_embed_index_delete", "passed": True})

                stage = "real preferences and feedback"
                original = (await api.get("/api/v1/preferences", headers=admin_headers)).json()
                changed = await api.put(
                    "/api/v1/preferences",
                    headers=admin_headers,
                    json={**original, "high_contrast": not original["high_contrast"]},
                )
                assert changed.status_code == 200
                assert (await api.get("/api/v1/preferences", headers=admin_headers)).json()[
                    "high_contrast"
                ] != original["high_contrast"]
                await api.put("/api/v1/preferences", headers=admin_headers, json=original)
                response = await api.post(
                    "/api/v1/feedback",
                    json={
                        "rating": 5,
                        "message": "Synthetic integration verification feedback.",
                        "language": "en",
                    },
                )
                assert response.status_code == 201
                feedback_id = response.json()["id"]
                assert any(
                    f["id"] == feedback_id
                    for f in (await api.get("/api/v1/admin/feedback", headers=admin_headers)).json()
                )
                record({"test": "real_preferences_and_feedback", "passed": True})

                stage = "real resource management"
                response = await api.post(
                    "/api/v1/admin/resources",
                    headers=admin_headers,
                    json={
                        "name": "Synthetic integration resource",
                        "type": "Illustrative",
                        "description": "Disposable synthetic resource for workflow verification only.",
                        "url": "https://example.org",
                        "verified": False,
                    },
                )
                assert response.status_code == 201
                temporary_resource = response.json()["id"]
                assert (
                    await api.delete("/api/v1/admin/resources/" + temporary_resource, headers=admin_headers)
                ).status_code == 204
                temporary_resource = None
                record({"test": "real_resource_create_delete", "passed": True})

                stage = "executed safety rule suite"
                response = await api.post("/api/v1/admin/safety-tests/run", headers=admin_headers)
                assert response.status_code == 200 and len(response.json()) == 14
                assert all(c["passed"] for c in response.json())
                record({"test": "safety_rules_executed", "passed": True, "case_count": 14})
            except Exception as exc:
                record(
                    {
                        "test": stage,
                        "passed": False,
                        "error_type": type(exc).__name__,
                        "detail": str(exc)
                        if isinstance(exc, AssertionError)
                        else "Private service diagnostics suppressed",
                    }
                )
            finally:
                if saved_session and admin_headers:
                    await api.delete("/api/v1/chat/sessions/" + saved_session, headers=admin_headers)
                if temporary_doc and admin_headers:
                    await api.delete("/api/v1/admin/documents/" + temporary_doc, headers=admin_headers)
                if temporary_resource and admin_headers:
                    await api.delete("/api/v1/admin/resources/" + temporary_resource, headers=admin_headers)
                with SessionLocal() as db:
                    if not had_preferences:
                        row = db.scalar(
                            select(Preference).where(Preference.user_id == creds["SUPABASE_ADMIN_USER_ID"])
                        )
                        if row:
                            db.delete(row)
                    if feedback_id:
                        row = db.get(Feedback, feedback_id)
                        if row:
                            db.delete(row)
                    if disposable_id:
                        row = db.get(User, disposable_id)
                        if row:
                            db.delete(row)
                    db.commit()
                if disposable_id:
                    removed = await auth.delete("/auth/v1/admin/users/" + disposable_id, headers=auth_headers)
                    record(
                        {"test": "disposable_account_cleanup", "passed": removed.status_code in (200, 204)}
                    )
    report = {
        "mode": "real",
        "embedding_model": cfg.embedding_model,
        "llm_model": cfg.nvidia_model,
        "checks": results,
        "all_passed": all(r["passed"] for r in results),
    }
    report_path = Path(__file__).resolve().parents[2] / "artifacts" / "live-validation.json"
    report_path.parent.mkdir(exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=True))
    if not report["all_passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
