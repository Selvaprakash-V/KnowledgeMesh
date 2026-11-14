import uuid

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.exceptions import AppError
from app.models import User
from app.security.denylist import is_revoked
from app.security.jwt import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials if credentials else request.cookies.get("access_token")
    if not token:
        raise AppError("UNAUTHENTICATED", "Authentication is required.", 401)
    payload = decode_access_token(token)
    if payload.get("jti") and is_revoked(payload["jti"]):
        raise AppError("UNAUTHENTICATED", "Authentication token is no longer valid.", 401)
    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise AppError("UNAUTHENTICATED", "Authentication is required.", 401) from exc
    user = db.get(User, user_id)
    if user is None or user.status != "ACTIVE":
        raise AppError("UNAUTHENTICATED", "Authentication is required.", 401)
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "ADMIN":
        raise AppError("FORBIDDEN", "Administrator access is required.", 403)
    return user


def client_ip(request: Request) -> str | None:
    if request.client is None:
        return None
    return request.client.host
