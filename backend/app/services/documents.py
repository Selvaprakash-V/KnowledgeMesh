import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.exceptions import AppError, PermanentIngestionError
from app.models import Document, KnowledgeBase, User
from app.repositories.audit import write_audit
from app.services.graph.store import get_graph_store
from app.services.ingestion.validate import sha256_bytes, validate_upload
from app.services.retrieval.qdrant_store import get_vector_store
from app.services.storage import get_storage
from app.utils.time import utcnow

logger = logging.getLogger(__name__)


def create_document(
    db: Session,
    *,
    kb: KnowledgeBase,
    user: User,
    filename: str,
    data: bytes,
    replaces_document_id: uuid.UUID | None,
    ip_address: str | None,
) -> Document:
    safe_name, mime_type = validate_upload(filename, data)
    checksum = sha256_bytes(data)
    existing = db.scalar(
        select(Document).where(
            Document.knowledge_base_id == kb.id,
            Document.checksum == checksum,
            Document.status != "ARCHIVED",
        )
    )
    if existing is not None and existing.id != replaces_document_id:
        raise AppError("DUPLICATE_DOCUMENT", "This file already exists in the knowledge base.", 409)
    version = 1
    if replaces_document_id is not None:
        previous = db.get(Document, replaces_document_id)
        if previous is None or previous.knowledge_base_id != kb.id:
            raise AppError("DOCUMENT_NOT_FOUND", "The document being replaced was not found in this knowledge base.", 404)
        version = previous.version + 1
    document = Document(
        knowledge_base_id=kb.id,
        filename=safe_name,
        mime_type=mime_type,
        file_size=len(data),
        checksum=checksum,
        storage_key="pending",
        version=version,
        status="UPLOADED",
        uploaded_by=user.id,
        graph_status="PENDING",
        is_active=True,
        replaces_document_id=replaces_document_id,
        metadata_json={"access_level": kb.visibility},
    )
    db.add(document)
    db.flush()
    document.storage_key = f"{kb.id}/{document.id}/{safe_name}"
    get_storage().save(document.storage_key, data)
    write_audit(
        db,
        user_id=user.id,
        action="document.upload",
        resource_type="document",
        resource_id=str(document.id),
        metadata={"filename": safe_name, "knowledge_base_id": str(kb.id)},
        ip_address=ip_address,
    )
    db.commit()
    db.refresh(document)
    enqueue_ingestion(str(document.id))
    db.refresh(document)
    return document


def delete_document(db: Session, document: Document, user: User, ip_address: str | None) -> None:
    if document.status == "INDEXED":
        try:
            get_vector_store().delete_document(str(document.id))
        except Exception as exc:
            raise AppError("VECTOR_STORE_UNAVAILABLE", "Could not remove the document from the vector index.", 503) from exc
    if document.graph_status == "INDEXED":
        try:
            get_graph_store().delete_document(str(document.id), str(document.knowledge_base_id))
        except Exception as exc:
            raise AppError("GRAPH_UNAVAILABLE", "Could not remove the document from the knowledge graph.", 503) from exc
    try:
        get_storage().delete(document.storage_key)
    except Exception:
        logger.warning("Stored file for document %s could not be deleted", document.id)
    write_audit(
        db,
        user_id=user.id,
        action="document.delete",
        resource_type="document",
        resource_id=str(document.id),
        metadata={"filename": document.filename},
        ip_address=ip_address,
    )
    db.delete(document)
    db.commit()


def reindex_document(db: Session, document: Document, user: User, ip_address: str | None) -> Document:
    if document.status == "ARCHIVED" or not document.is_active:
        raise AppError("DOCUMENT_ARCHIVED", "Archived documents are not reindexed. Upload a new version instead.", 400)
    document.status = "UPLOADED"
    document.error_message = None
    document.graph_status = "PENDING"
    document.graph_error = None
    document.updated_at = utcnow()
    write_audit(
        db,
        user_id=user.id,
        action="document.reindex",
        resource_type="document",
        resource_id=str(document.id),
        metadata={},
        ip_address=ip_address,
    )
    db.commit()
    enqueue_ingestion(str(document.id))
    db.refresh(document)
    return document


def enqueue_ingestion(document_id: str) -> None:
    settings = get_settings()
    if settings.ingestion_mode == "inline":
        from app.services.ingestion.pipeline import run_ingestion

        try:
            run_ingestion(document_id)
        except PermanentIngestionError:
            return
        except Exception:
            logger.exception("Inline ingestion failed for %s", document_id)
        return
    from app.workers.tasks import ingest_document

    try:
        ingest_document.delay(document_id)
    except Exception as exc:
        _mark_queue_failure(document_id)
        raise AppError("QUEUE_UNAVAILABLE", "The ingestion queue is unavailable.", 503) from exc


def _mark_queue_failure(document_id: str) -> None:
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        document = db.get(Document, uuid.UUID(document_id))
        if document is None:
            return
        document.status = "FAILED"
        document.error_message = "The ingestion queue is unavailable."
        document.updated_at = utcnow()
        db.commit()
    finally:
        db.close()
