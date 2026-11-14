from app.services.retrieval.types import RetrievedChunk, tokenize


def bm25_rank(chunks: list[RetrievedChunk], query: str, top_k: int) -> list[RetrievedChunk]:
    if not chunks or top_k <= 0:
        return []
    from rank_bm25 import BM25Okapi

    corpus = []
    usable: list[RetrievedChunk] = []
    for chunk in chunks:
        tokens = tokenize(chunk.text)
        if not tokens:
            continue
        corpus.append(tokens)
        usable.append(chunk)
    query_tokens = tokenize(query)
    if not corpus or not query_tokens:
        return []
    scores = BM25Okapi(corpus).get_scores(query_tokens)
    ranked = sorted(zip(usable, scores), key=lambda item: float(item[1]), reverse=True)
    results: list[RetrievedChunk] = []
    for chunk, score in ranked[:top_k]:
        if float(score) <= 0:
            continue
        results.append(
            RetrievedChunk(
                chunk_id=chunk.chunk_id,
                document_id=chunk.document_id,
                knowledge_base_id=chunk.knowledge_base_id,
                filename=chunk.filename,
                page_number=chunk.page_number,
                section=chunk.section,
                text=chunk.text,
                score=float(score),
                source="keyword",
                text_hash=chunk.text_hash,
                access_level=chunk.access_level,
            )
        )
    return results
