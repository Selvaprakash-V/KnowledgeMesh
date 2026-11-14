from pathlib import Path

import boto3

from app.config import Settings, get_settings
from app.exceptions import AppError


class LocalStorage:
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, key: str, data: bytes) -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def read(self, key: str) -> bytes:
        path = self._path(key)
        if not path.exists():
            raise AppError("FILE_NOT_FOUND", "The stored file could not be found.", 404)
        return path.read_bytes()

    def delete(self, key: str) -> None:
        path = self._path(key)
        if path.exists():
            path.unlink()

    def _path(self, key: str) -> Path:
        parts = Path(key).parts
        if not key or ".." in parts or Path(key).is_absolute():
            raise AppError("INVALID_STORAGE_KEY", "The storage key is not valid.", 400)
        path = (self.root / key).resolve()
        if not path.is_relative_to(self.root):
            raise AppError("INVALID_STORAGE_KEY", "The storage key is not valid.", 400)
        return path


class S3Storage:
    def __init__(self, settings: Settings):
        if not settings.storage_bucket:
            raise AppError("STORAGE_NOT_CONFIGURED", "STORAGE_BUCKET is required for S3 storage.", 503)
        self.bucket = settings.storage_bucket
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.storage_endpoint or None,
            aws_access_key_id=settings.storage_access_key or None,
            aws_secret_access_key=settings.storage_secret_key or None,
            region_name=settings.storage_region,
        )

    def save(self, key: str, data: bytes) -> None:
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data)

    def read(self, key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=key)


def get_storage():
    settings = get_settings()
    if settings.storage_provider == "local":
        return LocalStorage(Path(settings.storage_local_path))
    if settings.storage_provider == "s3":
        return S3Storage(settings)
    raise AppError("STORAGE_NOT_CONFIGURED", f"Unsupported storage provider '{settings.storage_provider}'.", 503)
