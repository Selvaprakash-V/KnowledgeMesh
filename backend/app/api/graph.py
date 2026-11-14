from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.exceptions import AppError
from app.models import User
from app.repositories.access import accessible_kb_ids
from app.schemas.api import GraphQueryRequest
from app.services.authorization import resolve_scope
from app.services.graph.store import get_graph_store
from app.services.rag.classifier import extract_terms

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/entities")
def list_entities(knowledge_base_id: str | None = None, q: str = "", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    kb_ids = _ids(db, user, knowledge_base_id)
    try:
        return get_graph_store().list_entities(kb_ids, q)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("GRAPH_UNAVAILABLE", "The knowledge graph is unavailable.", 503) from exc


@router.get("/entities/{entity_id}")
def get_entity(entity_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        entity = get_graph_store().get_entity(entity_id)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("GRAPH_UNAVAILABLE", "The knowledge graph is unavailable.", 503) from exc
    if entity is None:
        raise AppError("ENTITY_NOT_FOUND", "Entity not found.", 404)
    allowed = {str(item) for item in accessible_kb_ids(db, user)}
    if entity.get("knowledge_base_id") not in allowed:
        raise AppError("FORBIDDEN", "You do not have access to this entity.", 403)
    return entity


@router.post("/query")
def query_graph(body: GraphQueryRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scope = resolve_scope(db, user, body.knowledge_base_id, None)
    try:
        facts = get_graph_store().search(extract_terms(body.query), scope.kb_ids, depth=2)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("GRAPH_UNAVAILABLE", "The knowledge graph is unavailable.", 503) from exc
    return {"facts": [fact.__dict__ for fact in facts]}


@router.get("/subgraph")
def get_subgraph(knowledge_base_id: str | None = None, limit: int = 100, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    kb_ids = _ids(db, user, knowledge_base_id)
    try:
        return get_graph_store().get_subgraph(kb_ids, limit=limit)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("GRAPH_UNAVAILABLE", "The knowledge graph is unavailable.", 503) from exc


def _ids(db: Session, user: User, knowledge_base_id: str | None) -> list[str]:
    import uuid

    parsed = uuid.UUID(knowledge_base_id) if knowledge_base_id else None
    return resolve_scope(db, user, parsed, None).kb_ids
