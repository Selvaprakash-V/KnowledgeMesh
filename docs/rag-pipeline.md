# RAG pipeline

Defaults are 800 tokens per chunk and 120 tokens of overlap. Both are environment settings. Markdown headings and PDF pages become chunk metadata.

Keyword retrieval is Okapi BM25 over the authorized chunks stored in PostgreSQL. Vector retrieval embeds the question and queries the `knowledge_chunks` Qdrant collection with a knowledge-base filter. Reciprocal rank fusion combines the two lists. The reranker then keeps `RERANK_TOP_K` chunks, default 8, from up to `RERANK_CANDIDATES`, default 30.

The lexical reranker promotes BM25 matches and keeps remaining semantic hits so a pure vector match is not discarded. Its scores are not probabilities, so the API returns `confidence: null`. Cross-encoder and Cohere scores are normalized and can produce a confidence value from the cited chunks only.

If no authorized evidence is found, the standard insufficient-evidence sentence is returned and the LLM is not called. Citation markers that do not match a supplied chunk are removed. A response that copies the system-instruction markers is replaced with a refusal.
