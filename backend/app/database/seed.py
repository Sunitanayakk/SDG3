from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.models.entities import (
    ChatSession,
    Document,
    Feedback,
    KnowledgeSource,
    Message,
    Resource,
    SafetyCase,
    Usage,
    User,
)
from app.services.safety import CASES

RESOURCE_DATA = [
    (
        "eSanjeevani",
        "Teleconsultation",
        "Government telemedicine platform for connecting patients with clinicians.",
        "Schedules and registration depend on the official portal; no live availability here.",
        "https://esanjeevani.mohfw.gov.in/",
        True,
        None,
    ),
    (
        "India emergency response",
        "Emergency",
        "National emergency response service.",
        "India only. Call 112 in an emergency; this app does not dispatch help.",
        "https://www.mha.gov.in/emergency-response-support-system-erss",
        True,
        "112",
    ),
    (
        "Odisha ambulance",
        "Emergency",
        "Emergency Medical Ambulance Service in Odisha.",
        "Odisha only. This directory does not track ambulance availability.",
        "https://nhmodisha.gov.in/patient_transport_2/",
        True,
        "108",
    ),
    (
        "ABHA information",
        "Digital health",
        "Official information about the Ayushman Bharat Digital Mission.",
        "Check official privacy and consent requirements before sharing records.",
        "https://abdm.gov.in/",
        True,
        None,
    ),
    (
        "PM-JAY beneficiary portal",
        "Access support",
        "Official portal for checking beneficiary information.",
        "Eligibility is determined by the official programme, not this prototype.",
        "https://beneficiary.nha.gov.in/",
        True,
        None,
    ),
    (
        "Community support example",
        "Illustrative",
        "Synthetic example of asking a community worker for help navigating a portal.",
        "Illustrative workflow, not a real provider listing.",
        "https://nhmodisha.gov.in/",
        False,
        None,
    ),
    (
        "Family assisted access example",
        "Illustrative",
        "Synthetic example of a family member helping with accessibility settings.",
        "Illustrative workflow; do not share private records in this demo.",
        "https://abdm.gov.in/",
        False,
        None,
    ),
    (
        "Rural connectivity example",
        "Illustrative",
        "Synthetic example of preparing a written question before an online visit.",
        "No connectivity, appointment or service availability is guaranteed.",
        "https://esanjeevani.mohfw.gov.in/",
        False,
        None,
    ),
    (
        "Large text support example",
        "Illustrative",
        "Use the prototype accessibility controls to enlarge interface text.",
        "Illustrative app support; no external support service is implied.",
        "https://www.w3.org/WAI/",
        False,
        None,
    ),
    (
        "Language assistance example",
        "Illustrative",
        "Synthetic example of requesting help understanding information.",
        "Medical translations require professional validation.",
        "https://nhmodisha.gov.in/",
        False,
        None,
    ),
]


def seed(db):
    if db.scalar(select(User).where(User.id == "synthetic-patient-01")):
        return
    user = User(id="synthetic-patient-01", display_name="Asha (fictional)", synthetic=True)
    db.add(user)
    db.flush()
    for i in range(12):
        session = ChatSession(
            id=f"demo-session-{i + 1:03}",
            user_id=user.id,
            title=["Online doctor access", "Accessibility settings", "Trusted sources"][i % 3],
            language=["en", "hi", "or"][i % 3],
        )
        db.add(session)
        db.flush()
        db.add(
            Message(
                session_id=session.id,
                role="assistant",
                content="Synthetic example conversation. No real patient data.",
                citations=[],
            )
        )
    for i in range(24):
        category = ["Service navigation", "Accessibility", "Safety", "Digital health"][i % 4]
        source = KnowledgeSource(id=f"demo-source-{i + 1:03}", title=f"Illustrative {category} guide {i + 1}")
        db.add(source)
        db.flush()
        db.add(
            Document(
                id=f"demo-doc-{i + 1:03}",
                source_id=source.id,
                title=source.title,
                category=category,
                language=["en", "hi", "or"][i % 3],
                synthetic=True,
                status="indexed",
                content="Synthetic educational workflow. Use official healthcare services for professional advice.",
            )
        )
    for i, row in enumerate(RESOURCE_DATA):
        db.add(
            Resource(
                id=f"resource-{i + 1:02}",
                **dict(
                    zip(
                        ["name", "type", "description", "notes", "url", "verified", "phone"], row, strict=True
                    )
                ),
            )
        )
    for i in range(15):
        db.add(
            Feedback(
                id=f"demo-feedback-{i + 1:03}",
                rating=3 + i % 3,
                message=[
                    "The large text setting was helpful.",
                    "Please add more navigation examples.",
                    "The source links were clear.",
                ][i % 3],
                language=["en", "hi", "or"][i % 3],
                synthetic=True,
            )
        )
    for day in range(30):
        for i in range(12 + day % 8):
            db.add(
                Usage(
                    language=["en", "hi", "or"][i % 3],
                    retrieved=i % 5 != 0,
                    latency_ms=300 + i * 17,
                    synthetic=True,
                    created_at=datetime.now(timezone.utc) - timedelta(days=29 - day),
                )
            )
    for i, (question, language, expected, category) in enumerate(CASES):
        db.add(
            SafetyCase(
                id=f"safety-{i + 1:02}",
                question=question,
                language=language,
                expected=expected,
                category=category,
            )
        )
    db.commit()
