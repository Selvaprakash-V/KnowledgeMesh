import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Document, KnowledgeBase, KnowledgeBaseMember, User
from app.security.permissions import can_read_kb


def get_membership(db: Session, knowledge_base_id: uuid.UUID, user_id: uuid.UUID) -> KnowledgeBaseMember | None:
    return db.scalar(
        select(KnowledgeBaseMember).where(
            KnowledgeBaseMember.knowledge_base_id == knowledge_base_id,
            KnowledgeBaseMember.user_id == user_id,
        )
    )


def accessible_kb_ids(db: Session, user: User) -> list[uuid.UUID]:
    if user.role == "ADMIN":
        return list(db.scalars(select(KnowledgeBase.id)))
    member_ids = select(KnowledgeBaseMember.knowledge_base_id).where(KnowledgeBaseMember.user_id == user.id)
    stmt = select(KnowledgeBase.id).where(
        or_(
            KnowledgeBase.owner_id == user.id,
            KnowledgeBase.visibility == "INTERNAL",
            KnowledgeBase.id.in_(member_ids),
        )
    )
    return list(db.scalars(stmt))


def list_readable_knowledge_bases(db: Session, user: User) -> list[KnowledgeBase]:
    ids = accessible_kb_ids(db, user)
    if not ids:
        return []
    return list(db.scalars(select(KnowledgeBase).where(KnowledgeBase.id.in_(ids)).order_by(KnowledgeBase.name)))


def user_can_read_kb(db: Session, user: User, kb: KnowledgeBase) -> bool:
    return can_read_kb(user, kb, get_membership(db, kb.id, user.id))


def document_counts(db: Session, knowledge_base_id: uuid.UUID) -> int:
    return int(
        db.scalar(
            select(func.count())
            .select_from(Document)
            .where(Document.knowledge_base_id == knowledge_base_id, Document.status != "ARCHIVED")
        )
        or 0
    )
