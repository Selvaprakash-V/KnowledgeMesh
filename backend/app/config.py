from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    app_name: str = "KnowledgeMesh"
    auto_migrate: bool = True
    cors_origins: str = "http://localhost:5173"

    database_url: str = "postgresql+psycopg://knowledgemesh:knowledgemesh@localhost:5432/knowledgemesh"
    redis_url: str = "redis://localhost:6379/0"

    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    qdrant_collection: str = "knowledge_chunks"

    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = "knowledgemesh"

    llm_provider: str = ""
    llm_model: str = ""
    llm_temperature: float = 0.0
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    gemini_api_key: str = ""
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    anthropic_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"

    embedding_provider: str = ""
    embedding_model: str = ""
    embedding_dimension: int = 0
    embedding_batch_size: int = 32

    reranker_provider: str = "lexical"
    reranker_model: str = "BAAI/bge-reranker-base"
    cohere_api_key: str = ""

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    storage_provider: str = "local"
    storage_local_path: str = "./data/uploads"
    storage_bucket: str = ""
    storage_endpoint: str = ""
    storage_access_key: str = ""
    storage_secret_key: str = ""
    storage_region: str = "us-east-1"
    max_upload_bytes: int = 25 * 1024 * 1024

    chunk_size_tokens: int = 800
    chunk_overlap_tokens: int = 120
    context_token_budget: int = 3500
    history_token_budget: int = 1500
    chat_history_messages: int = 8

    retrieval_vector_k: int = 20
    retrieval_keyword_k: int = 20
    retrieval_rrf_k: int = 60
    rerank_candidates: int = 30
    rerank_top_k: int = 8

    graph_extraction_batch_size: int = 3
    graph_max_chunks: int = 40

    ingestion_mode: str = "celery"
    rate_limit_per_minute: int = 60

    bootstrap_admin_email: str = ""
    bootstrap_admin_password: str = ""
    bootstrap_admin_name: str = "Administrator"

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


INSECURE_SECRETS = {
    "",
    "change-me",
    "change-me-in-production",
    "dev-only-change-me",
    "test-secret-key",
}


def validate_runtime(settings: Settings) -> None:
    if settings.chunk_overlap_tokens >= settings.chunk_size_tokens:
        raise RuntimeError("CHUNK_OVERLAP_TOKENS must be smaller than CHUNK_SIZE_TOKENS")
    if settings.chunk_size_tokens < 100:
        raise RuntimeError("CHUNK_SIZE_TOKENS must be at least 100")
    if settings.rerank_top_k < 1 or settings.rerank_candidates < settings.rerank_top_k:
        raise RuntimeError("RERANK_CANDIDATES must be greater than or equal to RERANK_TOP_K")
    if settings.app_env == "production":
        if settings.jwt_secret in INSECURE_SECRETS or len(settings.jwt_secret) < 32:
            raise RuntimeError("JWT_SECRET must be a unique value of at least 32 characters in production")
        if settings.ingestion_mode not in {"celery", "inline"}:
            raise RuntimeError("INGESTION_MODE must be celery or inline")
