import uuid
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.exceptions import AppError
from app.models import Document, KnowledgeBase, User
from app.repositories.access import accessible_kb_ids, get_membership
from app.security.permissions import can_delete_kb, can_manage_kb, can_read_kb


@dataclass
class SearchScope:
    kb_ids: list[str]
    document_id: str | None
    knowledge_base_id: str | None


def require_kb(db: Session, knowledge_base_id: uuid.UUID) -> KnowledgeBase:
    kb = db.get(KnowledgeBase, knowledge_base_id)
    if kb is None:
        raise AppError("KNOWLEDGE_BASE_NOT_FOUND", "Knowledge base not found.", 404)
    return kb


def require_read(db: Session, user: User, kb: KnowledgeBase) -> None:
    if not can_read_kb(user, kb, get_membership(db, kb.id, user.id)):
        raise AppError("FORBIDDEN", "You do not have access to this knowledge base.", 403)


def require_manage(db: Session, user: User, kb: KnowledgeBase) -> None:
    if not can_manage_kb(user, kb, get_membership(db, kb.id, user.id)):
        raise AppError("FORBIDDEN", "You do not have permission to manage this knowledge base.", 403)


def require_delete(user: User, kb: KnowledgeBase) -> None:
    if not can_delete_kb(user, kb):
        raise AppError("FORBIDDEN", "You do not have permission to delete this knowledge base.", 403)


def resolve_scope(db: Session, user: User, knowledge_base_id: uuid.UUID | None, document_id: uuid.UUID | None) -> SearchScope:
    allowed = [str(item) for item in accessible_kb_ids(db, user)]
    if knowledge_base_id is not None:
        if str(knowledge_base_id) not in allowed:
            raise AppError("FORBIDDEN", "You do not have access to this knowledge base.", 403)
        kb_ids = [str(knowledge_base_id)]
    else:
        kb_ids = allowed
    resolved_document = None
    if document_id is not None:
        document = db.get(Document, document_id)
        if document is None or str(document.knowledge_base_id) not in set(kb_ids) or not document.is_active:
            raise AppError("FORBIDDEN", "You do not have access to this document.", 404)
        resolved_document = str(document.id)
    return SearchScope(
        kb_ids=kb_ids,
        document_id=resolved_document,
        knowledge_base_id=str(knowledge_base_id) if knowledge_base_id else None,
    )
