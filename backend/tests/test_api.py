from app.core.config import settings


def test_greeting_explains_capabilities_without_fabricating_evidence(client):
    response = client.post("/api/v1/chat", json={"message": "Hello!"})
    assert response.status_code == 200
    assert "How can I help you today?" in response.json()["reply"]
    assert response.json()["citations"] == []
    assert response.json()["retrieval"]["used"] is False


def chat(client, question, **extra):
    return client.post("/api/v1/chat", json={"message": question, "language": "en", **extra})


def test_health_and_public_config(client):
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/api/v1/config/public").json()["provider_connected"] is False
    assert len(client.get("/api/v1/languages").json()) == 3


def test_demo_chat_and_citations(client):
    reply = chat(client, "How can I access a doctor online?").json()
    assert reply["mode"] == "demo"
    assert reply["retrieval"]["used"]
    assert reply["citations"][0]["source_id"] == "demo-source-001"
    assert reply["citations"][0]["verified"] is False
    assert reply["citations"][0]["url"] is None


def test_arbitrary_demo_question_is_honest(client):
    assert "not configured" in chat(client, "Explain quantum medicine").json()["reply"]


def test_no_default_persistence(client, db):
    from sqlalchemy import func, select

    from app.models.entities import ChatSession

    initial = db.scalar(select(func.count()).select_from(ChatSession))
    chat(client, "Online doctor")
    assert db.scalar(select(func.count()).select_from(ChatSession)) == initial


def test_session_ownership_and_preferences(client):
    first = client.post("/api/v1/auth/demo").json()["access_token"]
    second = client.post("/api/v1/auth/demo").json()["access_token"]
    h1, h2 = {"Authorization": "Bearer " + first}, {"Authorization": "Bearer " + second}
    result = client.post("/api/v1/chat", headers=h1, json={"message": "Online doctor", "persist": True})
    sid = result.json()["session_id"]
    assert client.get("/api/v1/chat/sessions/" + sid, headers=h1).status_code == 200
    assert client.get("/api/v1/chat/sessions/" + sid, headers=h2).status_code == 404
    assert client.delete("/api/v1/chat/sessions/" + sid, headers=h2).status_code == 404
    prefs = client.put("/api/v1/preferences", headers=h1, json={"language": "or", "high_contrast": True})
    assert prefs.json()["language"] == "or"
    assert client.get("/api/v1/preferences", headers=h1).json()["high_contrast"]
    assert client.delete("/api/v1/chat/sessions/" + sid, headers=h1).status_code == 204


def test_admin_authorization(client):
    assert client.get("/api/v1/admin/documents").status_code == 401
    token = client.post("/api/v1/auth/demo").json()["access_token"]
    assert (
        client.get("/api/v1/admin/documents", headers={"Authorization": "Bearer " + token}).status_code == 403
    )
    assert (
        client.get("/api/v1/admin/overview", headers={"Authorization": "Bearer invalid"}).status_code == 401
    )


def test_document_lifecycle_and_filters(client, admin_headers):
    data = {"title": "Synthetic uploaded guide", "category": "Accessibility", "language": "hi"}
    result = client.post(
        "/api/v1/admin/documents",
        data=data,
        files={"file": ("guide.txt", b"This is a synthetic guide to accessibility settings.")},
        headers=admin_headers,
    )
    assert result.status_code == 201, result.text
    ident = result.json()["id"]
    assert result.json()["synthetic"]
    index = client.post("/api/v1/admin/documents/" + ident + "/index", headers=admin_headers)
    assert index.json()["status"] == "indexed"
    rows = client.get(
        "/api/v1/admin/documents?q=Synthetic%20uploaded&language=hi", headers=admin_headers
    ).json()
    assert len(rows) == 1 and rows[0]["id"] == ident
    assert client.get("/api/v1/admin/documents/" + ident, headers=admin_headers).json()["content"]
    assert client.delete("/api/v1/admin/documents/" + ident, headers=admin_headers).status_code == 204
    assert client.get("/api/v1/admin/documents/" + ident, headers=admin_headers).status_code == 404


def test_upload_validation(client, admin_headers):
    for filename, content, expected in [
        ("x.exe", b"malicious", 415),
        ("x.pdf", b"not PDF", 422),
        ("x.txt", b"a", 422),
        ("x.txt", b"a" * 5242881, 413),
    ]:
        response = client.post(
            "/api/v1/admin/documents",
            data={"title": "Invalid upload"},
            files={"file": (filename, content)},
            headers=admin_headers,
        )
        assert response.status_code == expected


def test_feedback_resources_and_analytics(client, admin_headers):
    assert len(client.get("/api/v1/health-resources").json()) == 10
    response = client.post("/api/v1/feedback", json={"message": "Synthetic useful feedback", "rating": 4})
    assert response.status_code == 201
    assert client.get("/api/v1/admin/overview", headers=admin_headers).json()["feedback_submissions"] == 16
    assert len(client.get("/api/v1/admin/feedback", headers=admin_headers).json()) == 16
    rows = client.get("/api/v1/admin/analytics?language=hi", headers=admin_headers).json()["rows"]
    assert rows and all(r["language"] == "hi" for r in rows)
    resource = {
        "name": "Illustrative service",
        "type": "Illustrative",
        "description": "Synthetic service only.",
        "url": "https://example.org",
        "verified": False,
    }
    result = client.post("/api/v1/admin/resources", headers=admin_headers, json=resource)
    assert result.status_code == 201
    ident = result.json()["id"]
    assert (
        client.put(
            "/api/v1/admin/resources/" + ident,
            headers=admin_headers,
            json={**resource, "name": "Updated synthetic service"},
        ).status_code
        == 200
    )
    assert client.delete("/api/v1/admin/resources/" + ident, headers=admin_headers).status_code == 204


def test_safety_results_not_preinvented(client, admin_headers):
    before = client.get("/api/v1/admin/safety-tests", headers=admin_headers).json()
    assert len(before) >= 12 and all(c["actual"] is None for c in before)
    result = client.post("/api/v1/admin/safety-tests/run", headers=admin_headers).json()
    assert all(c["passed"] is True for c in result)


def test_validation_and_rate_limit(client, monkeypatch):
    assert chat(client, "", language="xx").status_code == 422
    from app.core.rate_limit import _windows

    _windows.clear()
    monkeypatch.setattr(settings(), "rate_limit", 2)
    assert chat(client, "one").status_code == 200
    assert chat(client, "two").status_code == 200
    result = chat(client, "three")
    assert result.status_code == 429 and result.headers["Retry-After"] == "60"


def test_demo_auth_disabled_in_real_mode(client, monkeypatch):
    monkeypatch.setattr(settings(), "demo_mode", False)
    assert client.post("/api/v1/auth/demo?role=admin").status_code == 404
