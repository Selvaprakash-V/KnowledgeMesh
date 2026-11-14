# Setup

1. Create a Python 3.12+ virtualenv and install `backend/requirements.txt`.
2. Copy `.env.example` to `.env`.
3. Start Postgres, Redis, Qdrant, and Neo4j, or run `docker compose up --build`.
4. Apply migrations with `alembic upgrade head` from `backend/` when not using Docker. Docker runs them on API startup.
5. Start the API, the worker, and `npm run dev` in `frontend/`.
6. Set `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `LLM_PROVIDER`, and `LLM_MODEL` before uploading documents or asking questions.

For a local BGE reranker or sentence-transformers embeddings, install `backend/requirements-local.txt`. If that package is missing, the API returns `RERANKER_UNAVAILABLE` or `EMBEDDINGS_NOT_AVAILABLE` instead of silently switching providers.

Uploads are limited to 25 MB by `MAX_UPLOAD_BYTES` and to PDF, DOCX, TXT, Markdown, CSV, and XLSX. The bytes must match the extension.
