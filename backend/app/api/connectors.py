from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.models import User
from app.schemas.connectors import ConnectorSyncRequest, ConnectorSyncResponse
from app.services.connectors.manager import list_connectors, sync_connector, toggle_connector

router = APIRouter(prefix="/connectors", tags=["connectors"])


@router.get("")
def get_connectors(user: User = Depends(get_current_user)):
    return list_connectors()


@router.post("/{provider}/sync", response_model=ConnectorSyncResponse)
def trigger_sync(provider: str, body: ConnectorSyncRequest, user: User = Depends(get_current_user)):
    try:
        return sync_connector(provider, incremental=body.incremental)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/{provider}/toggle")
def toggle(provider: str, enabled: bool, user: User = Depends(get_current_user)):
    try:
        return toggle_connector(provider, enabled)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
