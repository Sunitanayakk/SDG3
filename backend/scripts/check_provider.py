"""Small synthetic live inference probe. Never prints keys, prompts or reasoning."""

import asyncio
import json
import time

from fastapi import HTTPException

from app.ai.provider import NvidiaProvider
from app.core.config import settings
from app.rag.pipeline import grounded_citations


async def main():
    started = time.perf_counter()
    try:
        answer = await NvidiaProvider().generate(
            "According to the supplied synthetic record, what is the service called?",
            "en",
            "[S1] Synthetic configuration-test record: the fictional service is named Demo Care Navigation.",
        )
        _, citations = grounded_citations(
            answer,
            [
                {
                    "source_id": "synthetic-smoke-source",
                    "title": "Synthetic configuration test",
                    "url": None,
                    "verified": False,
                }
            ],
        )
        print(
            json.dumps(
                {
                    "status": "ok",
                    "model": settings().nvidia_model,
                    "elapsed_seconds": round(time.perf_counter() - started, 2),
                    "final_answer_received": bool(answer.strip()),
                    "citation_reference_valid": bool(citations),
                    "scope": "synthetic provider smoke test; not end-to-end application RAG",
                    "application_mode": "demo" if settings().demo_mode else "real",
                }
            )
        )
    except HTTPException as exc:
        print(
            json.dumps(
                {
                    "status": "failed",
                    "model": settings().nvidia_model,
                    "http_status": exc.status_code,
                    "message": exc.detail,
                }
            )
        )
        raise SystemExit(1) from None
    except Exception as exc:
        print(
            json.dumps(
                {
                    "status": "failed",
                    "error_type": type(exc).__name__,
                    "message": "Provider check failed; private diagnostic details suppressed.",
                }
            )
        )
        raise SystemExit(1) from None


if __name__ == "__main__":
    asyncio.run(main())
