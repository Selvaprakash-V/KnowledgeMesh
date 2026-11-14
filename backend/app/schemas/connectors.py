import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class ConnectorConfig(BaseModel):
    provider: Literal["google_drive", "onedrive", "notion", "confluence", "local_watcher"]
    name: str
    enabled: bool = True
    knowledge_base_id: uuid.UUID | None = None
    sync_frequency_minutes: int = 60
    folder_or_workspace_id: str | None = None
    last_synced_at: datetime | None = None
    synced_documents_count: int = 0
    status: Literal["IDLE", "SYNCING", "ERROR", "DISABLED"] = "IDLE"
    error_message: str | None = None


class ConnectorSyncRequest(BaseModel):
    provider: str
    knowledge_base_id: uuid.UUID | None = None
    incremental: bool = True


class ConnectorSyncResponse(BaseModel):
    provider: str
    status: str
    documents_discovered: int
    documents_ingested: int
    duration_ms: float
    synced_at: datetime
