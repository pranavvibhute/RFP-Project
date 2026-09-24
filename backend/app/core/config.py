from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str
    APP_VERSION: str
    DEBUG: bool

    DATABASE_URL: str

    GEMINI_API_KEY: str
    GEMINI_MODEL: str

    AI_PRIMARY_PROVIDER: str = "qwen"
    AI_FALLBACK_PROVIDER: str = "gemini"

    QWEN_BASE_URL: str = ""
    QWEN_API_KEY: str | None = None
    QWEN_MODEL: str = "qwen3-instruct"
    QWEN_TIMEOUT_SECONDS: float = 90.0

    EMBEDDING_MODEL: str = "BAAI/bge-large-en-v1.5"

    QDRANT_URL: str = ""
    QDRANT_LOCATION: str = ":memory:"
    QDRANT_API_KEY: str | None = None
    QDRANT_COLLECTION: str = "bidwise_rfp_chunks"

    RAG_CHUNK_SIZE: int = 1400
    RAG_CHUNK_OVERLAP: int = 200
    RAG_TOP_K: int = 5

    AI_FALLBACK_CONFIDENCE_THRESHOLD: float = 0.72
    AI_MAX_PROMPT_CHARS: int = 200000
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
