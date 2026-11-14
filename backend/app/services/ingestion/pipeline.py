import hashlib
import logging
import tempfile
import uuid
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.exceptions import AppError, PermanentIngestionError
from app.models import Document, DocumentChunk, KnowledgeBase
from app.services.embeddings.factory import get_embedding_provider
from app.services.graph.extractor import GraphExtractionError, extract_graph
from app.services.graph.store import get_graph_store
from app.services.ingestion.chunker import chunk_blocks
from app.services.ingestion.parsers import parse_file
from app.services.ingestion.tokens import count_tokens
from app.services.llm.factory import get_llm_provider
from app.services.retrieval.qdrant_store import get_vector_store
from app.services.storage import get_storage
from app.utils.time import utcnow

logger = logging.getLogger(__name__)


def run_ingestion(document_id: str) -> None:
    db = SessionLocal()
    try:
        document = db.get(Document, uuid.UUID(document_id))
        if document is None or document.status == "ARCHIVED":
            return
        document.status = "PROCESSING"
        document.error_message = None
        document.updated_at = utcnow()
        db.commit()
        try:
            _process(db, document)
        except PermanentIngestionError:
            raise
        except AppError as exc:
            if exc.status_code < 500:
                _fail(db, document.id, exc.message)
                raise PermanentIngestionError(exc.message, exc.code) from exc
            raise
    finally:
        db.close()


def _process(db: Session, document: Document) -> None:
    data = get_storage().read(document.storage_key)
    temp_path = _write_temp(document, data)
    try:
        blocks = parse_file(temp_path, document.filename)
    except Exception as exc:
        _fail(db, document.id, "Unable to extract text from the document.")
        raise PermanentIngestionError("Unable to extract text from the document.") from exc
    finally:
        if temp_path.exists():
            temp_path.unlink()

    drafts = chunk_blocks(blocks)
    if not drafts:
        _fail(db, document.id, "No text could be extracted from the document.")
        raise PermanentIngestionError("No text could be extracted from the document.")

    db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document.id))
    chunks: list[DocumentChunk] = []
    for draft in drafts:
        chunk = DocumentChunk(
            document_id=document.id,
            chunk_index=draft.chunk_index,
            page_number=draft.page_number,
            section=draft.section,
            text=draft.text,
            token_count=draft.token_count or count_tokens(draft.text),
            text_hash=hashlib.sha256(draft.text.encode("utf-8")).hexdigest(),
            metadata_json=draft.metadata,
        )
        chunks.append(chunk)
        db.add(chunk)
    document.metadata_json = {
        **(document.metadata_json or {}),
        "chunk_count": len(chunks),
        "page_count": len({block.page_number for block in blocks if block.page_number}),
        "access_level": _access_level(db, document),
    }
    db.commit()
    db.refresh(document)
    chunks = list(db.scalars(select(DocumentChunk).where(DocumentChunk.document_id == document.id).order_by(DocumentChunk.chunk_index)))

    try:
        embedder = get_embedding_provider()
        vectors = embedder.embed_documents([chunk.text for chunk in chunks])
        store = get_vector_store()
        store.ensure(len(vectors[0]))
        access_level = document.metadata_json.get("access_level", "")
        store.upsert(
            [
                {
                    "id": str(chunk.id),
                    "vector": vector,
                    "payload": {
                        "chunk_id": str(chunk.id),
                        "document_id": str(document.id),
                        "knowledge_base_id": str(document.knowledge_base_id),
                        "filename": document.filename,
                        "page_number": chunk.page_number,
                        "section": chunk.section or "",
                        "access_level": access_level,
                        "text_hash": chunk.text_hash,
                        "active": True,
                    },
                }
                for chunk, vector in zip(chunks, vectors)
            ]
        )
    except PermanentIngestionError:
        raise
    except AppError as exc:
        _fail(db, document.id, exc.message)
        if exc.status_code >= 500:
            raise
        raise PermanentIngestionError(exc.message, exc.code) from exc
    except Exception as exc:
        _fail(db, document.id, "Failed to embed or index the document.")
        raise AppError("INDEXING_FAILED", "Failed to embed or index the document.", 503) from exc

    document.status = "INDEXED"
    document.error_message = None
    document.updated_at = utcnow()
    _extract_and_store_graph(db, document, chunks)
    _archive_replaced(db, document)
    db.commit()


def _extract_and_store_graph(db: Session, document: Document, chunks: list[DocumentChunk]) -> None:
    try:
        llm = get_llm_provider()
    except AppError as exc:
        document.graph_status = "SKIPPED"
        document.graph_error = exc.message
        return
    try:
        payload = extract_graph(llm, chunks, str(document.knowledge_base_id))
        get_graph_store().replace_document_graph(str(document.id), str(document.knowledge_base_id), document.filename, payload)
        document.graph_status = "INDEXED"
        document.graph_error = payload.get("warning")
    except (GraphExtractionError, AppError) as exc:
        document.graph_status = "FAILED"
        document.graph_error = exc.message if isinstance(exc, AppError) else str(exc)
        logger.warning("Graph extraction failed for document %s", document.id)
    except Exception as exc:
        document.graph_status = "FAILED"
        document.graph_error = "Knowledge graph update failed."
        logger.exception("Graph update failed for document %s", document.id)
        raise AppError("GRAPH_UNAVAILABLE", "Knowledge graph update failed.", 503) from exc


def _archive_replaced(db: Session, document: Document) -> None:
    if document.replaces_document_id is None:
        return
    previous = db.get(Document, document.replaces_document_id)
    if previous is None or previous.id == document.id:
        return
    try:
        get_vector_store().delete_document(str(previous.id))
    except Exception as exc:
        raise AppError("VECTOR_STORE_UNAVAILABLE", "Could not retire the previous document version from the vector index.", 503) from exc
    if previous.graph_status == "INDEXED":
        try:
            get_graph_store().delete_document(str(previous.id), str(previous.knowledge_base_id))
        except Exception as exc:
            raise AppError("GRAPH_UNAVAILABLE", "Could not retire the previous document version from the graph.", 503) from exc
    previous.is_active = False
    previous.status = "ARCHIVED"
    previous.updated_at = utcnow()


def _access_level(db: Session, document: Document) -> str:
    kb = db.get(KnowledgeBase, document.knowledge_base_id)
    return kb.visibility if kb else ""


def _fail(db: Session, document_id: uuid.UUID, message: str) -> None:
    db.rollback()
    document = db.get(Document, document_id)
    if document is None:
        return
    document.status = "FAILED"
    document.error_message = message[:1000]
    if document.graph_status == "PENDING":
        document.graph_status = "SKIPPED"
        document.graph_error = "Graph extraction did not run because indexing failed."
    document.updated_at = utcnow()
    db.commit()


def _write_temp(document: Document, data: bytes) -> Path:
    suffix = Path(document.filename).suffix.lower()
    handle = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    handle.write(data)
    handle.close()
    return Path(handle.name)
