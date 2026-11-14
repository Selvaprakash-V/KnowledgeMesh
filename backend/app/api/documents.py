import uuid

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user
from app.database import get_db
from app.exceptions import AppError
from app.models import Document, DocumentChunk, User
from app.repositories.access import accessible_kb_ids
from app.schemas.api import DocumentOut
from app.security.rate_limit import enforce_rate_limit
from app.services.authorization import require_kb, require_manage, require_read
from app.services.documents import create_document, delete_document, reindex_document

router = APIRouter(tags=["documents"])


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ids = accessible_kb_ids(db, user)
    if not ids:
        return []
    rows = db.scalars(select(Document).where(Document.knowledge_base_id.in_(ids), Document.status != "ARCHIVED").order_by(Document.created_at.desc()))
    return list(rows)


@router.get("/knowledge-bases/{knowledge_base_id}/documents", response_model=list[DocumentOut])
def list_kb_documents(knowledge_base_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    kb = require_kb(db, knowledge_base_id)
    require_read(db, user, kb)
    rows = db.scalars(select(Document).where(Document.knowledge_base_id == kb.id, Document.status != "ARCHIVED").order_by(Document.created_at.desc()))
    return list(rows)


@router.post("/knowledge-bases/{knowledge_base_id}/documents", response_model=DocumentOut, status_code=202)
async def upload_document(
    knowledge_base_id: uuid.UUID,
    request: Request,
    file: UploadFile = File(...),
    replaces_document_id: uuid.UUID | None = Form(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enforce_rate_limit(request, "upload")
    kb = require_kb(db, knowledge_base_id)
    require_manage(db, user, kb)
    data = await file.read()
    document = create_document(
        db,
        kb=kb,
        user=user,
        filename=file.filename or "upload",
        data=data,
        replaces_document_id=replaces_document_id,
        ip_address=client_ip(request),
    )
    return document


@router.get("/documents/{document_id}", response_model=DocumentOut)
def get_document(document_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = _document(db, user, document_id)
    return document


@router.get("/documents/{document_id}/status", response_model=DocumentOut)
def document_status(document_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _document(db, user, document_id)


@router.get("/documents/{document_id}/file")
def download_document(document_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.storage import get_storage

    document = _document(db, user, document_id)
    data = get_storage().read(document.storage_key)
    return Response(content=data, media_type=document.mime_type, headers={"Content-Disposition": f'inline; filename="{document.filename}"'})


@router.get("/documents/{document_id}/chunks/{chunk_id}")
def get_chunk(document_id: uuid.UUID, chunk_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = _document(db, user, document_id)
    chunk = db.get(DocumentChunk, chunk_id)
    if chunk is None or chunk.document_id != document.id:
        raise AppError("CHUNK_NOT_FOUND", "Chunk not found.", 404)
    return {
        "id": str(chunk.id),
        "document_id": str(document.id),
        "document_name": document.filename,
        "page_number": chunk.page_number,
        "section": chunk.section,
        "text": chunk.text,
        "knowledge_base_id": str(document.knowledge_base_id),
    }


@router.delete("/documents/{document_id}", status_code=204)
def remove_document(document_id: uuid.UUID, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = _document(db, user, document_id, manage=True)
    delete_document(db, document, user, client_ip(request))


@router.post("/documents/{document_id}/reindex", response_model=DocumentOut, status_code=202)
def reindex(document_id: uuid.UUID, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = _document(db, user, document_id, manage=True)
    return reindex_document(db, document, user, client_ip(request))


def _document(db: Session, user: User, document_id: uuid.UUID, manage: bool = False) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise AppError("DOCUMENT_NOT_FOUND", "Document not found.", 404)
    kb = require_kb(db, document.knowledge_base_id)
    if manage:
        require_manage(db, user, kb)
    else:
        require_read(db, user, kb)
    return document
