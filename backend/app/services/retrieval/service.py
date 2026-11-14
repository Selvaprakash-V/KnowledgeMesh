import time

from app.exceptions import AppError
from app.services.rag.classifier import extract_terms
from app.services.retrieval.bm25 import bm25_rank
from app.services.retrieval.chunks import indexed_chunk_count, load_chunks
from app.services.retrieval.fusion import fuse_results
from app.services.retrieval.types import RetrievedChunk


def vector_search(deps, question: str, kb_ids: list[str], document_id: str | None, limit: int) -> tuple[list[RetrievedChunk], float]:
    if indexed_chunk_count(deps.db, kb_ids, document_id) == 0:
        return [], 0.0
    if deps.embedder is None or deps.vector_store is None:
        raise AppError("EMBEDDINGS_NOT_CONFIGURED", "Embeddings and Qdrant must be configured before retrieval.", 503)
    started = time.perf_counter()
    try:
        vector = deps.embedder.embed_query(question)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("EMBEDDINGS_UNAVAILABLE", "The embedding provider is unavailable.", 503) from exc
    embedding_ms = (time.perf_counter() - started) * 1000
    try:
        hits = deps.vector_store.search(vector, kb_ids, document_id, limit)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("VECTOR_STORE_UNAVAILABLE", "Qdrant is unavailable.", 503) from exc
    scores = {chunk_id: score for chunk_id, score in hits}
    chunks = load_chunks(deps.db, kb_ids, document_id, list(scores))
    for chunk in chunks:
        chunk.score = scores.get(chunk.chunk_id, 0.0)
        chunk.source = "vector"
    return chunks, embedding_ms


def keyword_search(deps, question: str, kb_ids: list[str], document_id: str | None, limit: int) -> list[RetrievedChunk]:
    chunks = load_chunks(deps.db, kb_ids, document_id)
    return bm25_rank(chunks, question, limit)


def fuse(deps, vector_hits, keyword_hits) -> list[RetrievedChunk]:
    return fuse_results(vector_hits, keyword_hits, deps.settings.retrieval_rrf_k)


def rerank(deps, question: str, fused: list[RetrievedChunk]) -> tuple[list[RetrievedChunk], bool]:
    if deps.reranker is None:
        raise AppError("RERANKER_UNAVAILABLE", "No reranker is configured.", 503)
    candidates = fused[: deps.settings.rerank_candidates]
    ranked = deps.reranker.rerank(question, candidates, deps.settings.rerank_top_k)
    return ranked, bool(getattr(deps.reranker, "scores_normalized", False))


def graph_search(deps, question: str, terms: list[str], kb_ids: list[str], query_type: str):
    if deps.graph_store is None:
        raise AppError("GRAPH_UNAVAILABLE", "The knowledge graph is unavailable.", 503)
    lookup_terms = terms or extract_terms(question)
    depth = 2 if query_type == "RELATIONSHIP" else 1
    try:
        return deps.graph_store.search(lookup_terms, kb_ids, depth=depth)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("GRAPH_UNAVAILABLE", "The knowledge graph is unavailable.", 503) from exc
