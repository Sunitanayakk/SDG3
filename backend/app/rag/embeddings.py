import asyncio
import math
from typing import Protocol

import httpx
from fastapi import HTTPException

from app.core.config import settings


class Embeddings(Protocol):
    async def embed(self, texts: list[str], query: bool = False) -> list[list[float]]: ...


def validate(vectors: list[list[float]], count: int) -> list[list[float]]:
    if len(vectors) != count or any(
        len(v) != settings().embedding_dimensions or not all(math.isfinite(x) for x in v) for v in vectors
    ):
        raise HTTPException(502, "Embedding count/dimension does not match configured index")
    if any(not any(v) for v in vectors):
        raise HTTPException(502, "Embedding provider returned a zero vector")
    return vectors


class ExternalEmbeddings:
    async def embed(self, texts: list[str], query: bool = False):
        cfg = settings()
        if not cfg.embedding_base_url:
            raise HTTPException(503, "Configure an OpenAI-compatible multilingual embedding endpoint")
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    cfg.embedding_base_url.rstrip("/") + "/embeddings",
                    headers={"Authorization": f"Bearer {cfg.embedding_api_key}"},
                    json={"model": cfg.embedding_model, "input": texts},
                )
                response.raise_for_status()
                data = sorted(response.json()["data"], key=lambda d: d["index"])
                return validate([d["embedding"] for d in data], len(texts))
        except (httpx.HTTPError, KeyError, ValueError):
            raise HTTPException(502, "Embedding service unavailable or response invalid") from None


class NvidiaEmbeddings:
    """Hosted multilingual embeddings with explicit query/passage semantics."""

    def __init__(self, transport: httpx.AsyncBaseTransport | None = None):
        self.transport = transport

    async def embed(self, texts: list[str], query: bool = False):
        cfg = settings()
        key = cfg.embedding_api_key or cfg.nvidia_api_key
        if not key:
            raise HTTPException(503, "Configure the server-side NVIDIA embedding credential")
        try:
            async with httpx.AsyncClient(transport=self.transport, timeout=60) as client:
                response = await client.post(
                    (cfg.embedding_base_url or cfg.nvidia_base_url).rstrip("/") + "/embeddings",
                    headers={"Authorization": "Bearer " + key},
                    json={
                        "model": cfg.embedding_model,
                        "input": texts,
                        "input_type": "query" if query else "passage",
                        "dimensions": cfg.embedding_dimensions,
                        "encoding_format": "float",
                        "truncate": "NONE",
                    },
                )
                if response.status_code == 429:
                    raise HTTPException(429, "Embedding quota or rate limit reached. Retry later.")
                response.raise_for_status()
                data = sorted(response.json()["data"], key=lambda d: d["index"])
                if [d["index"] for d in data] != list(range(len(texts))):
                    raise ValueError("Invalid embedding indexes")
                return validate([d["embedding"] for d in data], len(texts))
        except httpx.TimeoutException:
            raise HTTPException(504, "Embedding provider timed out. Retry after the service wakes.") from None
        except (httpx.HTTPError, KeyError, TypeError, ValueError):
            raise HTTPException(502, "NVIDIA embedding service unavailable or response invalid") from None


class LocalEmbeddings:
    def __init__(self):
        self.model = None

    async def embed(self, texts: list[str], query: bool = False):
        def encode():
            try:
                from sentence_transformers import SentenceTransformer
            except ImportError:
                raise HTTPException(
                    503, "Install optional sentence-transformers for local embeddings"
                ) from None
            if self.model is None:
                self.model = SentenceTransformer(settings().embedding_model)
            prefix = "query: " if query else "passage: "
            return self.model.encode([prefix + t for t in texts], normalize_embeddings=True).tolist()

        return validate(await asyncio.to_thread(encode), len(texts))


_local = LocalEmbeddings()


def embedding_provider() -> Embeddings:
    if settings().embedding_provider == "nvidia":
        return NvidiaEmbeddings()
    if settings().embedding_provider == "local":
        return _local
    if settings().embedding_provider == "external":
        return ExternalEmbeddings()
    raise HTTPException(503, "Unsupported embedding provider")
