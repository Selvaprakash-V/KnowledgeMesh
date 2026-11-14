import hashlib
from pathlib import Path

from app.config import get_settings
from app.exceptions import AppError
from app.services.ingestion.parsers import ALLOWED_EXTENSIONS


def validate_upload(filename: str, data: bytes) -> tuple[str, str]:
    settings = get_settings()
    safe_name = Path(filename).name
    if not safe_name or safe_name in {".", ".."}:
        raise AppError("INVALID_FILENAME", "The file name is not valid.", 400)
    extension = Path(safe_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise AppError(
            "UNSUPPORTED_FILE_TYPE",
            "Supported file types are PDF, DOCX, TXT, Markdown, CSV, and XLSX.",
            400,
        )
    if not data:
        raise AppError("EMPTY_FILE", "The uploaded file is empty.", 400)
    if len(data) > settings.max_upload_bytes:
        raise AppError("FILE_TOO_LARGE", "The file exceeds the configured upload size limit.", 400)
    if extension == ".pdf" and not data.startswith(b"%PDF"):
        raise AppError("INVALID_FILE_SIGNATURE", "The file content is not a PDF.", 400)
    if extension in {".docx", ".xlsx"} and not data.startswith(b"PK"):
        raise AppError("INVALID_FILE_SIGNATURE", "The file content is not an Office Open XML document.", 400)
    if extension in {".txt", ".md", ".markdown", ".csv"}:
        try:
            data.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise AppError("INVALID_TEXT_ENCODING", "Text files must be UTF-8 encoded.", 400) from exc
    return safe_name, ALLOWED_EXTENSIONS[extension]


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
