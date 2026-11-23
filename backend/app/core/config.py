from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")
    demo_mode: bool = True
    database_url: str = "sqlite:///./swasthyasetu.db"
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "minimaxai/minimax-m3.1-flash"
    nvidia_max_tokens: int = Field(default=16384, ge=128, le=65536)
    nvidia_reasoning_effort: str = "low"
    nvidia_timeout_seconds: int = Field(default=90, ge=5, le=120)
    nvidia_temperature: float = Field(default=1.0, ge=0, le=2)
    nvidia_top_p: float = Field(default=0.95, gt=0, le=1)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    embedding_provider: str = "nvidia"
    embedding_model: str = "nvidia/nemotron-3-embed-1b"
    embedding_dimensions: int = 2048
    embedding_base_url: str = "https://integrate.api.nvidia.com/v1"
    embedding_api_key: str = ""
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:8081"]
    max_upload_bytes: int = 5 * 1024 * 1024
    rate_limit: int = 20

    @model_validator(mode="after")
    def real_requirements(self):
        if not self.demo_mode:
            if not self.database_url.startswith("postgresql") or not self.supabase_url:
                raise ValueError("Real mode requires PostgreSQL and SUPABASE_URL; demo auth is disabled.")
        if not 8 <= self.embedding_dimensions <= 4096:
            raise ValueError("Embedding dimension must be 8..4096")
        return self


@lru_cache
def settings() -> Settings:
    return Settings()
