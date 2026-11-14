# GraphRAG

LangGraph runs this path:

`analyze_query -> extract_entities -> retrieve_vector -> retrieve_keyword -> retrieve_graph or skip_graph -> fuse_results -> rerank -> validate_evidence -> generate_answer -> validate_citations`

Graph retrieval runs for `RELATIONSHIP`, `COMPARISON`, `ANALYTICAL`, and `MULTI_DOCUMENT` questions. Factual questions do not call Neo4j.

Extraction asks the configured LLM for JSON and keeps only entity and relationship types from the allowlist. `GOVERNED_BY` is stored as `GOVERNS` with the direction reversed so the governing thing points at the governed thing. Each fact stores `source_document_id`, `source_chunk_id`, and the model's confidence when that value is between 0 and 1. Missing or invalid confidence is stored as null.

Graph search looks for one-hop links, and two-hop paths for relationship questions, limited to the caller's knowledge bases. If Neo4j is down, those questions fail with `GRAPH_UNAVAILABLE`. They do not fall back to invented relationships.
