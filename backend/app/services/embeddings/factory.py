import httpx

from app.config import Settings, get_settings
from app.exceptions import AppError


class OpenAIEmbeddingProvider:
    def __init__(self, base_url: str, api_key: str, model: str, batch_size: int, dimension: int):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.batch_size = batch_size
        self._dimension = dimension

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        vectors: list[list[float] | None] = [None] * len(texts)
        for start in range(0, len(texts), self.batch_size):
            batch = texts[start : start + self.batch_size]
            payload = self._post({"model": self.model, "input": batch})
            for item in payload.get("data", []):
                vectors[start + int(item["index"])] = [float(value) for value in item["embedding"]]
        if any(vector is None for vector in vectors):
            raise AppError("EMBEDDING_FAILED", "The embedding provider returned an incomplete response.", 502)
        resolved = [vector for vector in vectors if vector is not None]
        self._remember_dimension(resolved[0])
        return resolved

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]

    def _remember_dimension(self, vector: list[float]) -> None:
        if self._dimension and len(vector) != self._dimension:
            raise AppError(
                "VECTOR_DIMENSION_MISMATCH",
                "The embedding dimension does not match EMBEDDING_DIMENSION.",
                500,
            )
        self._dimension = len(vector)

    def _post(self, body: dict) -> dict:
        try:
            response = httpx.post(
                f"{self.base_url}/embeddings",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json=body,
                timeout=60,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise AppError("EMBEDDING_FAILED", f"Embedding provider returned HTTP {exc.response.status_code}.", 502) from exc
        except httpx.HTTPError as exc:
            raise AppError("EMBEDDINGS_UNAVAILABLE", "The embedding provider is unavailable.", 503) from exc
        return response.json()


class OllamaEmbeddingProvider:
    def __init__(self, base_url: str, model: str, dimension: int):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._dimension = dimension

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        try:
            response = httpx.post(
                f"{self.base_url}/api/embed",
                json={"model": self.model, "input": texts},
                timeout=120,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise AppError("EMBEDDING_FAILED", f"Ollama returned HTTP {exc.response.status_code}.", 502) from exc
        except httpx.HTTPError as exc:
            raise AppError("EMBEDDINGS_UNAVAILABLE", "Ollama embeddings are unavailable.", 503) from exc
        vectors = response.json().get("embeddings") or []
        if len(vectors) != len(texts):
            raise AppError("EMBEDDING_FAILED", "Ollama returned an unexpected embedding payload.", 502)
        converted = [[float(value) for value in vector] for vector in vectors]
        if self._dimension and len(converted[0]) != self._dimension:
            raise AppError("VECTOR_DIMENSION_MISMATCH", "The embedding dimension does not match EMBEDDING_DIMENSION.", 500)
        self._dimension = len(converted[0])
        return converted

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]


class SentenceTransformerProvider:
    def __init__(self, model_name: str, dimension: int):
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:
            raise AppError(
                "EMBEDDINGS_NOT_AVAILABLE",
                "sentence-transformers is not installed. Install backend/requirements-local.txt or choose another embedding provider.",
                503,
            ) from exc
        self.model = SentenceTransformer(model_name)
        detected = int(self.model.get_sentence_embedding_dimension())
        if dimension and dimension != detected:
            raise AppError("VECTOR_DIMENSION_MISMATCH", "The embedding dimension does not match EMBEDDING_DIMENSION.", 500)
        self.dimension = detected

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        vectors = self.model.encode(texts, normalize_embeddings=True)
        return [[float(value) for value in row] for row in vectors]

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]


def get_embedding_provider():
    settings = get_settings()
    provider = settings.embedding_provider.strip().lower()
    model = settings.embedding_model.strip()
    if not provider or not model:
        raise AppError(
            "EMBEDDINGS_NOT_CONFIGURED",
            "Set EMBEDDING_PROVIDER and EMBEDDING_MODEL before indexing or searching.",
            503,
        )
    return _build(provider, model, settings)


def _build(provider: str, model: str, settings: Settings):
    dimension = settings.embedding_dimension
    if provider == "openai":
        if not settings.openai_api_key:
            raise AppError("EMBEDDINGS_NOT_CONFIGURED", "OPENAI_API_KEY is required for OpenAI embeddings.", 503)
        return OpenAIEmbeddingProvider(settings.openai_base_url, settings.openai_api_key, model, settings.embedding_batch_size, dimension)
    if provider == "ollama":
        return OllamaEmbeddingProvider(settings.ollama_base_url, model, dimension)
    if provider in {"bge", "e5", "local", "sentence-transformers"}:
        return SentenceTransformerProvider(model, dimension)
    raise AppError("EMBEDDINGS_NOT_CONFIGURED", f"Unsupported embedding provider '{provider}'.", 400)
