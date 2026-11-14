from dataclasses import replace

from app.services.retrieval.types import RetrievedChunk, reciprocal_rank_fusion


def fuse_results(vector_hits: list[RetrievedChunk], keyword_hits: list[RetrievedChunk], rrf_k: int) -> list[RetrievedChunk]:
    rankings = [
        [hit.chunk_id for hit in vector_hits],
        [hit.chunk_id for hit in keyword_hits],
    ]
    fused_scores = reciprocal_rank_fusion(rankings, k=rrf_k)
    lookup: dict[str, RetrievedChunk] = {}
    for hit in vector_hits + keyword_hits:
        lookup.setdefault(hit.chunk_id, hit)
    fused: list[RetrievedChunk] = []
    for chunk_id, score in fused_scores:
        fused.append(replace(lookup[chunk_id], score=score, source="fused"))
    return fused
