import asyncio
import json

import httpx
import pytest
from fastapi import HTTPException

from app.ai.provider import NvidiaProvider
from app.core.config import settings


def test_nvidia_normalization(monkeypatch):
    monkeypatch.setattr(settings(), "nvidia_api_key", "synthetic-test-key")

    def handler(request):
        payload = json.loads(request.content)
        assert payload["model"] == "minimaxai/minimax-m3.1-flash"
        assert payload["max_tokens"] == settings().nvidia_max_tokens
        assert payload["reasoning_effort"] == "low"
        assert payload["temperature"] == 1.0
        assert payload["top_p"] == 0.95
        assert payload["stream"] is False
        return httpx.Response(
            200,
            json={
                "id": "mock",
                "object": "chat.completion",
                "created": 1,
                "model": "minimaxai/minimax-m3.1-flash",
                "choices": [
                    {
                        "index": 0,
                        "finish_reason": "stop",
                        "message": {
                            "role": "assistant",
                            "content": "<think>private</think>Useful answer [S1]",
                            "reasoning_content": "private",
                        },
                    }
                ],
            },
        )

    result = asyncio.run(NvidiaProvider(httpx.MockTransport(handler)).generate("question", "en", "[S1] text"))
    assert result == "Useful answer [S1]"


@pytest.mark.parametrize("status,expected", [(429, 429), (500, 502), (401, 502)])
def test_provider_failure_no_demo_substitution(monkeypatch, status, expected):
    monkeypatch.setattr(settings(), "nvidia_api_key", "synthetic-test-key")
    transport = httpx.MockTransport(
        lambda req: httpx.Response(status, json={"error": {"message": "failure"}})
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(NvidiaProvider(transport).generate("question", "en", "context"))
    assert exc.value.status_code == expected


def test_provider_timeout(monkeypatch):
    monkeypatch.setattr(settings(), "nvidia_api_key", "synthetic-test-key")

    def handler(request):
        raise httpx.ReadTimeout("synthetic timeout", request=request)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(NvidiaProvider(httpx.MockTransport(handler)).generate("question", "en", "context"))
    assert exc.value.status_code == 504


@pytest.mark.parametrize(
    "choices",
    [
        None,
        [],
        [
            {
                "index": 0,
                "finish_reason": "length",
                "message": {
                    "role": "assistant",
                    "content": "Incomplete output",
                    "reasoning_content": "private",
                },
            }
        ],
    ],
)
def test_incomplete_provider_output_is_not_shown(monkeypatch, choices):
    monkeypatch.setattr(settings(), "nvidia_api_key", "synthetic-test-key")
    transport = httpx.MockTransport(
        lambda req: httpx.Response(
            200,
            json={
                "id": "synthetic",
                "object": "chat.completion",
                "created": 1,
                "model": settings().nvidia_model,
                "choices": choices,
            },
        )
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(NvidiaProvider(transport).generate("question", "en", "[S1] synthetic"))
    assert exc.value.status_code == 502
