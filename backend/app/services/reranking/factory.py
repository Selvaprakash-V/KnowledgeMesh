import math
from dataclasses import replace

import httpx

from app.config import get_settings
from app.exceptions import AppError
from app.services.retrieval.bm25 import bm25_rank
from app.services.retrieval.types import RetrievedChunk


class LexicalReranker:
    scores_normalized = False

    def rerank(self, query: str, items: list[RetrievedChunk], top_k: int) -> list[RetrievedChunk]:
        if not items:
            return []
        promoted = bm25_rank(items, query, top_k)
        seen = {item.chunk_id for item in promoted}
        remainder = [item for item in items if item.chunk_id not in seen]
        combined = (promoted + remainder)[:top_k]
        return [replace(item, source="reranked") for item in combined]


class CrossEncoderReranker:
    scores_normalized = True

    def __init__(self, model_name: str):
        try:
            from sentence_transformers import CrossEncoder
        except ImportError as exc:
            raise AppError(
                "RERANKER_UNAVAILABLE",
                "sentence-transformers is not installed. Install backend/requirements-local.txt or set RERANKER_PROVIDER=lexical.",
                503,
            ) from exc
        self.model = CrossEncoder(model_name)

    def rerank(self, query: str, items: list[RetrievedChunk], top_k: int) -> list[RetrievedChunk]:
        if not items:
            return []
        scores = self.model.predict([(query, item.text) for item in items])
        ranked = sorted(zip(items, scores), key=lambda pair: float(pair[1]), reverse=True)[:top_k]
        normalized = []
        for item, score in ranked:
            value = float(score)
            if value < 0 or value > 1:
                value = 1 / (1 + math.exp(-value))
            normalized.append(replace(item, score=value, source="reranked"))
        return normalized


class CohereReranker:
    scores_normalized = True

    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise AppError("RERANKER_UNAVAILABLE", "COHERE_API_KEY is required for the Cohere reranker.", 503)
        self.api_key = api_key
        self.model = model

    def rerank(self, query: str, items: list[RetrievedChunk], top_k: int) -> list[RetrievedChunk]:
        if not items:
            return []
        try:
            response = httpx.post(
                "https://api.cohere.com/v2/rerank",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={
                    "model": self.model,
                    "query": query,
                    "documents": [item.text for item in items],
                    "top_n": min(top_k, len(items)),
                },
                timeout=60,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise AppError("RERANKER_FAILED", f"Cohere returned HTTP {exc.response.status_code}.", 502) from exc
        except httpx.HTTPError as exc:
            raise AppError("RERANKER_UNAVAILABLE", "The Cohere reranker is unavailable.", 503) from exc
        results = []
        for row in response.json().get("results", []):
            item = items[int(row["index"])]
            results.append(replace(item, score=float(row["relevance_score"]), source="reranked"))
        return results


def get_reranker():
    settings = get_settings()
    provider = settings.reranker_provider.strip().lower()
    if provider in {"", "lexical", "bm25"}:
        return LexicalReranker()
    if provider in {"bge", "cross-encoder"}:
        return CrossEncoderReranker(settings.reranker_model)
    if provider == "cohere":
        return CohereReranker(settings.cohere_api_key, settings.reranker_model or "rerank-v3.5")
    raise AppError("RERANKER_UNAVAILABLE", f"Unsupported reranker provider '{provider}'.", 400)
