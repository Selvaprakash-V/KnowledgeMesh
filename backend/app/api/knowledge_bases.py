import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user
from app.database import get_db
from app.exceptions import AppError
from app.models import Document, KnowledgeBase, KnowledgeBaseMember, User
from app.repositories.access import document_counts, get_membership, list_readable_knowledge_bases
from app.repositories.audit import write_audit
from app.schemas.api import KnowledgeBaseCreate, KnowledgeBaseOut, KnowledgeBaseUpdate, MemberCreate, MemberOut
from app.security.permissions import can_create_kb, can_manage_kb
from app.services.authorization import require_delete, require_kb, require_manage, require_read
from app.services.documents import delete_document
from app.services.graph.store import get_graph_store
from app.services.retrieval.qdrant_store import get_vector_store
from app.services.storage import get_storage
from app.utils.time import utcnow

router = APIRouter(prefix="/knowledge-bases", tags=["knowledge-bases"])


@router.get("", response_model=list[KnowledgeBaseOut])
def list_knowledge_bases(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [_out(db, user, kb) for kb in list_readable_knowledge_bases(db, user)]


@router.post("", response_model=KnowledgeBaseOut, status_code=201)
def create_knowledge_base(
    body: KnowledgeBaseCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_create_kb(user):
        raise AppError("FORBIDDEN", "You do not have permission to create a knowledge base.", 403)
    kb = KnowledgeBase(name=body.name.strip(), description=body.description.strip(), owner_id=user.id, visibility=body.visibility)
    db.add(kb)
    db.flush()
    db.add(KnowledgeBaseMember(knowledge_base_id=kb.id, user_id=user.id, role="OWNER"))
    write_audit(db, user_id=user.id, action="knowledge_base.create", resource_type="knowledge_base", resource_id=str(kb.id), metadata={"name": kb.name}, ip_address=client_ip(request))
    db.commit()
    db.refresh(kb)
    return _out(db, user, kb)


@router.get("/{knowledge_base_id}", response_model=KnowledgeBaseOut)
def get_knowledge_base(knowledge_base_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    kb = require_kb(db, knowledge_base_id)
    require_read(db, user, kb)
    return _out(db, user, kb)


@router.patch("/{knowledge_base_id}", response_model=KnowledgeBaseOut)
def update_knowledge_base(
    knowledge_base_id: uuid.UUID,
    body: KnowledgeBaseUpdate,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kb = require_kb(db, knowledge_base_id)
    require_manage(db, user, kb)
    if body.name is not None:
        kb.name = body.name.strip()
    if body.description is not None:
        kb.description = body.description.strip()
    if body.visibility is not None:
        kb.visibility = body.visibility
    kb.updated_at = utcnow()
    write_audit(db, user_id=user.id, action="knowledge_base.update", resource_type="knowledge_base", resource_id=str(kb.id), metadata={}, ip_address=client_ip(request))
    db.commit()
    db.refresh(kb)
    return _out(db, user, kb)


@router.delete("/{knowledge_base_id}", status_code=204)
def delete_knowledge_base(knowledge_base_id: uuid.UUID, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    kb = require_kb(db, knowledge_base_id)
    require_delete(user, kb)
    documents = list(db.scalars(select(Document).where(Document.knowledge_base_id == kb.id)))
    for document in documents:
        if document.status == "INDEXED":
            get_vector_store().delete_document(str(document.id))
        if document.graph_status == "INDEXED":
            get_graph_store().delete_document(str(document.id), str(document.knowledge_base_id))
        try:
            get_storage().delete(document.storage_key)
        except Exception:
            pass
    write_audit(db, user_id=user.id, action="knowledge_base.delete", resource_type="knowledge_base", resource_id=str(kb.id), metadata={"name": kb.name}, ip_address=client_ip(request))
    db.delete(kb)
    db.commit()


@router.get("/{knowledge_base_id}/members", response_model=list[MemberOut])
def list_members(knowledge_base_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    kb = require_kb(db, knowledge_base_id)
    require_read(db, user, kb)
    rows = db.execute(
        select(KnowledgeBaseMember, User).join(User, User.id == KnowledgeBaseMember.user_id).where(KnowledgeBaseMember.knowledge_base_id == kb.id)
    ).all()
    return [MemberOut(user_id=member.user_id, email=account.email, name=account.name, role=member.role, created_at=member.created_at) for member, account in rows]


@router.post("/{knowledge_base_id}/members", response_model=MemberOut, status_code=201)
def add_member(
    knowledge_base_id: uuid.UUID,
    body: MemberCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    kb = require_kb(db, knowledge_base_id)
    require_manage(db, user, kb)
    account = db.scalar(select(User).where(User.email == body.email.lower()))
    if account is None:
        raise AppError("USER_NOT_FOUND", "No user exists with that email.", 404)
    existing = get_membership(db, kb.id, account.id)
    if existing is not None:
        existing.role = body.role
        member = existing
    else:
        member = KnowledgeBaseMember(knowledge_base_id=kb.id, user_id=account.id, role=body.role)
        db.add(member)
    write_audit(db, user_id=user.id, action="knowledge_base.member_add", resource_type="knowledge_base", resource_id=str(kb.id), metadata={"member": str(account.id), "role": body.role}, ip_address=client_ip(request))
    db.commit()
    db.refresh(member)
    return MemberOut(user_id=account.id, email=account.email, name=account.name, role=member.role, created_at=member.created_at)


@router.delete("/{knowledge_base_id}/members/{member_id}", status_code=204)
def remove_member(knowledge_base_id: uuid.UUID, member_id: uuid.UUID, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    kb = require_kb(db, knowledge_base_id)
    require_manage(db, user, kb)
    if member_id == kb.owner_id:
        raise AppError("CANNOT_REMOVE_OWNER", "The knowledge base owner cannot be removed.", 400)
    member = get_membership(db, kb.id, member_id)
    if member is None:
        raise AppError("MEMBER_NOT_FOUND", "That user is not a member of this knowledge base.", 404)
    db.delete(member)
    write_audit(db, user_id=user.id, action="knowledge_base.member_remove", resource_type="knowledge_base", resource_id=str(kb.id), metadata={"member": str(member_id)}, ip_address=client_ip(request))
    db.commit()


def _out(db: Session, user: User, kb: KnowledgeBase) -> KnowledgeBaseOut:
    membership = get_membership(db, kb.id, user.id)
    member_count = int(db.scalar(select(func.count()).select_from(KnowledgeBaseMember).where(KnowledgeBaseMember.knowledge_base_id == kb.id)) or 0)
    return KnowledgeBaseOut(
        id=kb.id,
        name=kb.name,
        description=kb.description,
        owner_id=kb.owner_id,
        visibility=kb.visibility,
        created_at=kb.created_at,
        updated_at=kb.updated_at,
        document_count=document_counts(db, kb.id),
        member_count=member_count,
        can_manage=can_manage_kb(user, kb, membership),
    )
