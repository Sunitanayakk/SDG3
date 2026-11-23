from typing import Literal

from pydantic import BaseModel, Field, HttpUrl

Language = Literal["en", "hi", "or"]


class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str = Field(min_length=1, max_length=4000)
    language: Language = "en"
    use_rag: bool = True
    top_k: int = Field(default=4, ge=1, le=10)
    persist: bool = False


class FeedbackRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    message: str = Field(min_length=2, max_length=2000)
    language: Language = "en"


class Preferences(BaseModel):
    display_name: str = Field(default="Demo guest", max_length=80)
    language: Language = "en"
    text_size: Literal["normal", "large", "extra"] = "normal"
    high_contrast: bool = False
    reduced_motion: bool = False
    text_only: bool = False
    voice: bool = False
    persist_chats: bool = False


class ResourceRequest(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    type: str = Field(min_length=2, max_length=60)
    description: str = Field(min_length=4, max_length=2000)
    notes: str = Field(default="Availability is not monitored.", max_length=2000)
    url: HttpUrl
    verified: bool = False
    phone: str | None = Field(default=None, pattern=r"^\+?[0-9]{3,15}$")
