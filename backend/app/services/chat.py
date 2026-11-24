import time
from uuid import uuid4

from fastapi import HTTPException

from app.ai.provider import NvidiaProvider
from app.core.config import settings
from app.models.entities import ChatSession, Message, Usage
from app.rag.pipeline import grounded_citations, retrieve
from app.services.conversation import conversational_reply
from app.services.safety import DISCLAIMER, EMERGENCY, RESTRICTED, classify

MISSING = {
    "en": "I do not have enough verified evidence to answer this question. Please consult a qualified healthcare professional.",
    "hi": "इस प्रश्न का उत्तर देने के लिए पर्याप्त सत्यापित जानकारी नहीं है। कृपया योग्य स्वास्थ्य पेशेवर से बात करें।",
    "or": "ଏହି ପ୍ରଶ୍ନର ଉତ୍ତର ପାଇଁ ଯଥେଷ୍ଟ ଯାଞ୍ଚିତ ତଥ୍ୟ ନାହିଁ। ଦୟାକରି ଯୋଗ୍ୟ ସ୍ୱାସ୍ଥ୍ୟ ପେଶାଦାରଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ।",
}


async def respond(db, req, user=None, technical=False):
    start = time.perf_counter()
    level = classify(req.message)
    mode = "demo" if settings().demo_mode else "real"
    hits, citations = [], []
    if level == "emergency":
        reply = EMERGENCY[req.language]
    elif level in {"restricted", "injection"}:
        reply = RESTRICTED[req.language] if level == "restricted" else MISSING[req.language]
    elif (conversation := conversational_reply(req.message, req.language)) is not None:
        # Application conversation, not a generated medical answer. Safety runs first.
        reply = conversation
    elif settings().demo_mode:
        t = req.message.lower()
        if any(word in t for word in ["doctor", "online", "डॉक्टर", "चिकित्सक", "ଡାକ୍ତର", "ଅନଲାଇନ"]):
            reply = {
                "en": "Demo example: eSanjeevani is a government telemedicine service. Open its official portal to check registration and current service schedules. This prototype cannot book visits or confirm availability.",
                "hi": "डेमो उदाहरण: eSanjeevani एक सरकारी टेलीमेडिसिन सेवा है। पंजीकरण और समय की जानकारी आधिकारिक पोर्टल पर देखें। यह प्रोटोटाइप बुकिंग नहीं करता।",
                "or": "ଡେମୋ ଉଦାହରଣ: eSanjeevani ଏକ ସରକାରୀ ଟେଲିମେଡିସିନ ସେବା। ପଞ୍ଜୀକରଣ ଓ ସମୟ ପାଇଁ ଅଧିକୃତ ପୋର୍ଟାଲ୍ ଦେଖନ୍ତୁ। ଏହି ପ୍ରୋଟୋଟାଇପ୍ ବୁକିଂ କରେ ନାହିଁ।",
            }[req.language]
            if req.use_rag:
                citations = [
                    {
                        "source_id": "demo-source-001",
                        "title": "Illustrative service navigation guide",
                        "url": None,
                        "verified": False,
                        "label": "S1",
                    }
                ]
                hits = [
                    {
                        **citations[0],
                        "snippet": "Synthetic retrieval example about accessing online services.",
                        "score": 0.89,
                    }
                ]
        elif any(word in t for word in ["accessibility", "large text", "भाषा", "ଅକ୍ଷର"]):
            reply = {
                "en": "Demo example: open Accessibility to change text size, contrast, motion and language. Text-based interaction is always available.",
                "hi": "डेमो उदाहरण: अक्षर आकार, कंट्रास्ट, गति और भाषा बदलने के लिए सुलभता खोलें।",
                "or": "ଡେମୋ ଉଦାହରଣ: ଅକ୍ଷର ଆକାର, କଣ୍ଟ୍ରାଷ୍ଟ, ଗତି ଓ ଭାଷା ବଦଳାଇବାକୁ ସୁଗମ୍ୟତା ଖୋଲନ୍ତୁ।",
            }[req.language]
        else:
            reply = "Demo content: this question has no scripted example. Real AI is not configured in Demo Mode. Try ‘How can I access a doctor online?’ or ‘How can I use large text?’"
    elif not req.use_rag:
        reply = MISSING[req.language]
    else:
        hits = await retrieve(db, req.message, req.top_k)
        if not hits:
            reply = MISSING[req.language]
        else:
            context = "\n\n".join(f"[S{i + 1}] {h['title']}\n{h['snippet']}" for i, h in enumerate(hits))
            answer = await NvidiaProvider().generate(req.message, req.language, context)
            reply, citations = grounded_citations(answer, hits)
    sid = req.session_id or str(uuid4())
    mid = str(uuid4())
    if req.persist:
        if user is None:
            raise HTTPException(401, "Sign in to opt into conversation persistence")
        session = db.get(ChatSession, sid)
        if session and session.user_id != user.id:
            raise HTTPException(404, "Session not found")
        if not session:
            session = ChatSession(id=sid, user_id=user.id, title=req.message[:80], language=req.language)
            db.add(session)
            db.flush()
        db.add_all(
            [
                Message(session_id=sid, role="user", content=req.message, citations=[]),
                Message(id=mid, session_id=sid, role="assistant", content=reply, citations=citations),
            ]
        )
    elapsed = round((time.perf_counter() - start) * 1000, 1)
    db.add(
        Usage(language=req.language, retrieved=bool(hits), latency_ms=elapsed, synthetic=settings().demo_mode)
    )
    db.commit()
    response = {
        "session_id": sid,
        "message_id": mid,
        "reply": reply,
        "language": req.language,
        "mode": mode,
        "safety_level": level,
        "citations": citations,
        "retrieval": {"used": bool(hits), "document_count": len(hits)},
        "disclaimer": DISCLAIMER,
        "translation_notice": "Hindi/Odia medical accuracy requires professional validation."
        if req.language != "en"
        else None,
    }
    if technical:
        response.update(
            {
                "snippets": hits,
                "latency_ms": elapsed,
                "model_status": "scripted_demo"
                if mode == "demo"
                else ("nvidia_called" if hits and citations else "not_called"),
            }
        )
    return response
