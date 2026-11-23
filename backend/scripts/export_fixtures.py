"""Rebuild the cross-platform synthetic fixture bundle from backend definitions."""

import json
from datetime import date, timedelta
from pathlib import Path

from app.database.seed import RESOURCE_DATA
from app.services.safety import CASES

stamp = "2026-11-17T09:00:00Z"
categories = ["Service navigation", "Accessibility", "Safety", "Digital health"]
resources = [
    {
        "id": f"resource-{i + 1:02}",
        **dict(zip(["name", "type", "description", "notes", "url", "verified", "phone"], r, strict=True)),
    }
    for i, r in enumerate(RESOURCE_DATA)
]
documents = [
    {
        "id": f"demo-doc-{i + 1:03}",
        "source_id": f"demo-source-{i + 1:03}",
        "title": f"Illustrative {categories[i % 4]} guide {i + 1}",
        "category": categories[i % 4],
        "language": ["en", "hi", "or"][i % 3],
        "status": "indexed",
        "synthetic": True,
        "url": None,
        "organization": "Synthetic demonstration",
        "verified": False,
        "created_at": stamp,
        "content": "Synthetic educational workflow. No real patient data.",
    }
    for i in range(24)
]
sessions = [
    {
        "id": f"demo-session-{i + 1:03}",
        "title": ["Online doctor access", "Accessibility settings", "Trusted sources"][i % 3],
        "language": ["en", "hi", "or"][i % 3],
        "created_at": stamp,
        "messages": [
            {
                "id": f"seed-message-{i}",
                "role": "assistant",
                "content": "Synthetic example conversation. No real patient data.",
                "citations": [],
                "mode": "demo",
            }
        ],
    }
    for i in range(12)
]
feedback = [
    {
        "id": f"demo-feedback-{i + 1:03}",
        "rating": 3 + i % 3,
        "message": [
            "The large text setting was helpful.",
            "Please add more navigation examples.",
            "The source links were clear.",
        ][i % 3],
        "language": ["en", "hi", "or"][i % 3],
        "synthetic": True,
        "created_at": stamp,
    }
    for i in range(15)
]
safety = [
    {
        "id": f"safety-{i + 1:02}",
        "question": q,
        "language": lang,
        "expected": expected,
        "category": category,
        "actual": None,
        "passed": None,
        "scope": "Deterministic rule classification only",
    }
    for i, (q, lang, expected, category) in enumerate(CASES)
]
analytics = [
    {
        "date": str(date(2026, 11, 17) - timedelta(days=29 - day)),
        "language": lang,
        "queries": 8 + (day * 3 + i) % 17,
        "retrieved": 6 + (day + i) % 7,
        "feedback": (day + i) % 4,
    }
    for day in range(30)
    for i, lang in enumerate(["en", "hi", "or"])
]
output = Path(__file__).resolve().parents[2] / "packages/api-contracts/src/fixtures.json"
output.write_text(
    json.dumps(
        dict(
            resources=resources,
            documents=documents,
            sessions=sessions,
            feedback=feedback,
            safety=safety,
            analytics=analytics,
        ),
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
