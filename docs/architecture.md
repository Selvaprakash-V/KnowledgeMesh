# Architecture

KnowledgeMesh keeps application state in PostgreSQL, chunk vectors in Qdrant, and extracted entities in Neo4j. Redis carries Celery jobs, rate limits, and token revocation. The React client talks only to FastAPI.

Ingestion stores the original file, parses it, chunks it with heading and page boundaries, embeds the chunks, and upserts Qdrant points that include `knowledge_base_id`, `document_id`, and `access_level`. Entity extraction runs only when an LLM provider is configured. If it is not, the document can still be `INDEXED` and `graph_status` is `SKIPPED` with an explicit error string. Graph failures do not delete the vectors.

Queries resolve the caller's knowledge-base scope first. Vector search, keyword search, and graph search all receive that scope. Chunk text is loaded back from PostgreSQL and dropped unless the parent document is active and indexed in an allowed knowledge base. The model prompt places evidence inside `<retrieved_evidence>` and tells the model that block is data.

Only the active document version stays in Qdrant and in the graph. Replacing a file keeps the previous version active until the new one is indexed.
