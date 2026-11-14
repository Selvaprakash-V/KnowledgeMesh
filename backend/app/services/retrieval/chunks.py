import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Document, DocumentChunk
from app.services.retrieval.types import RetrievedChunk


def indexed_chunk_count(db: Session, kb_ids: list[str], document_id: str | None) -> int:
    if not kb_ids:
        return 0
    kb_uuids = [uuid.UUID(value) for value in kb_ids]
    stmt = (
        select(func.count())
        .select_from(DocumentChunk)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(
            Document.knowledge_base_id.in_(kb_uuids),
            Document.is_active.is_(True),
            Document.status == "INDEXED",
        )
    )
    if document_id:
        stmt = stmt.where(Document.id == uuid.UUID(document_id))
    return int(db.scalar(stmt) or 0)


def load_chunks(db: Session, kb_ids: list[str], document_id: str | None = None, chunk_ids: list[str] | None = None) -> list[RetrievedChunk]:
    if not kb_ids:
        return []
    kb_uuids = [uuid.UUID(value) for value in kb_ids]
    stmt = (
        select(DocumentChunk, Document)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(
            Document.knowledge_base_id.in_(kb_uuids),
            Document.is_active.is_(True),
            Document.status == "INDEXED",
        )
    )
    if document_id:
        stmt = stmt.where(Document.id == uuid.UUID(document_id))
    if chunk_ids is not None:
        if not chunk_ids:
            return []
        stmt = stmt.where(DocumentChunk.id.in_([uuid.UUID(value) for value in chunk_ids]))
    rows = db.execute(stmt).all()
    chunks = [_to_chunk(chunk, document) for chunk, document in rows]
    if chunk_ids is None:
        return chunks
    order = {value: index for index, value in enumerate(chunk_ids)}
    return sorted(chunks, key=lambda item: order.get(item.chunk_id, 10**9))


def _to_chunk(chunk: DocumentChunk, document: Document) -> RetrievedChunk:
    return RetrievedChunk(
        chunk_id=str(chunk.id),
        document_id=str(document.id),
        knowledge_base_id=str(document.knowledge_base_id),
        filename=document.filename,
        page_number=chunk.page_number,
        section=chunk.section,
        text=chunk.text,
        score=0.0,
        source="keyword",
        text_hash=chunk.text_hash,
        access_level=(document.metadata_json or {}).get("access_level", ""),
    )
