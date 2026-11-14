import time
from datetime import datetime, timezone
from typing import Any
from app.schemas.connectors import ConnectorConfig, ConnectorSyncResponse

# In-memory / persistent connector registry
_CONNECTORS: dict[str, dict[str, Any]] = {
    "google_drive": {
        "provider": "google_drive",
        "name": "Google Drive (Enterprise Workspace)",
        "enabled": True,
        "sync_frequency_minutes": 30,
        "folder_or_workspace_id": "root/shared_drives/engineering_docs",
        "last_synced_at": datetime.now(timezone.utc),
        "synced_documents_count": 48,
        "status": "IDLE",
        "error_message": None,
    },
    "onedrive": {
        "provider": "onedrive",
        "name": "Microsoft OneDrive / SharePoint",
        "enabled": True,
        "sync_frequency_minutes": 60,
        "folder_or_workspace_id": "sharepoint/sites/corporate_governance",
        "last_synced_at": datetime.now(timezone.utc),
        "synced_documents_count": 27,
        "status": "IDLE",
        "error_message": None,
    },
    "notion": {
        "provider": "notion",
        "name": "Notion Knowledge Wiki",
        "enabled": False,
        "sync_frequency_minutes": 120,
        "folder_or_workspace_id": "notion_workspace_legal_ops",
        "last_synced_at": None,
        "synced_documents_count": 0,
        "status": "DISABLED",
        "error_message": None,
    },
    "confluence": {
        "provider": "confluence",
        "name": "Atlassian Confluence Spaces",
        "enabled": True,
        "sync_frequency_minutes": 60,
        "folder_or_workspace_id": "SPACE:ENG_ARCHITECTURE",
        "last_synced_at": datetime.now(timezone.utc),
        "synced_documents_count": 19,
        "status": "IDLE",
        "error_message": None,
    },
    "local_watcher": {
        "provider": "local_watcher",
        "name": "Local Directory Daemon Watcher",
        "enabled": True,
        "sync_frequency_minutes": 5,
        "folder_or_workspace_id": "/var/data/hot_drop_ingest",
        "last_synced_at": datetime.now(timezone.utc),
        "synced_documents_count": 12,
        "status": "IDLE",
        "error_message": None,
    },
}


def list_connectors() -> list[dict[str, Any]]:
    return list(_CONNECTORS.values())


def sync_connector(provider: str, incremental: bool = True) -> ConnectorSyncResponse:
    start_time = time.perf_counter()
    if provider not in _CONNECTORS:
        raise ValueError(f"Unknown connector provider: {provider}")

    connector = _CONNECTORS[provider]
    connector["status"] = "SYNCING"

    # Simulate discovery & delta sync
    time.sleep(0.05)
    discovered = 6 if incremental else 24
    ingested = 2 if incremental else 24

    connector["status"] = "IDLE"
    connector["last_synced_at"] = datetime.now(timezone.utc)
    connector["synced_documents_count"] += ingested
    duration_ms = (time.perf_counter() - start_time) * 1000

    return ConnectorSyncResponse(
        provider=provider,
        status="SUCCESS",
        documents_discovered=discovered,
        documents_ingested=ingested,
        duration_ms=round(duration_ms, 2),
        synced_at=connector["last_synced_at"],
    )


def toggle_connector(provider: str, enabled: bool) -> dict[str, Any]:
    if provider not in _CONNECTORS:
        raise ValueError(f"Unknown connector provider: {provider}")
    connector = _CONNECTORS[provider]
    connector["enabled"] = enabled
    connector["status"] = "IDLE" if enabled else "DISABLED"
    return connector
