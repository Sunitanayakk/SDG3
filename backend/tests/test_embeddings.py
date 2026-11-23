import asyncio
import json

import httpx
import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.rag.embeddings import NvidiaEmbeddings


@pytest.mark.parametrize("query,expected", [(True, "query"), (False, "passage")])
def test_nvidia_embeddings_use_compatible_query_passage_contract(monkeypatch, query, expected):
    cfg = settings()
    monkeypatch.setattr(cfg, "nvidia_api_key", "synthetic-only")
    monkeypatch.setattr(cfg, "embedding_model", "nvidia/nemotron-3.5-embed-1b")
    monkeypatch.setattr(cfg, "embedding_api_key", "")

    def handler(request):
        payload = json.loads(request.content)
        assert payload["input_type"] == expected
        assert payload["dimensions"] == cfg.embedding_dimensions
        assert payload["model"] == cfg.embedding_model
        assert payload["truncate"] == "NONE"
        return httpx.Response(
            200, json={"data": [{"index": 0, "embedding": [1.0] * cfg.embedding_dimensions}]}
        )

    vectors = asyncio.run(NvidiaEmbeddings(httpx.MockTransport(handler)).embed(["synthetic"], query=query))
    assert len(vectors[0]) == cfg.embedding_dimensions


@pytest.mark.parametrize("status,expected", [(429, 429), (503, 502), (401, 502)])
def test_nvidia_embedding_failures_are_explicit(monkeypatch, status, expected):
    monkeypatch.setattr(settings(), "nvidia_api_key", "synthetic-only")
    transport = httpx.MockTransport(lambda req: httpx.Response(status, json={"error": "synthetic"}))
    with pytest.raises(HTTPException) as exc:
        asyncio.run(NvidiaEmbeddings(transport).embed(["synthetic"]))
    assert exc.value.status_code == expected


def test_nvidia_embedding_timeout(monkeypatch):
    monkeypatch.setattr(settings(), "nvidia_api_key", "synthetic-only")

    def timeout(request):
        raise httpx.ReadTimeout("synthetic timeout", request=request)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(NvidiaEmbeddings(httpx.MockTransport(timeout)).embed(["synthetic"]))
    assert exc.value.status_code == 504
