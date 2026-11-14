from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user
from app.config import get_settings
from app.database import get_db
from app.exceptions import AppError
from app.models import User
from app.repositories.audit import write_audit
from app.schemas.api import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.security.denylist import revoke
from app.security.jwt import create_access_token, decode_access_token
from app.security.passwords import hash_password, verify_password
from app.security.rate_limit import enforce_rate_limit

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    enforce_rate_limit(request, "auth")
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise AppError("EMAIL_IN_USE", "An account with this email already exists.", 409)
    role = "ADMIN" if db.scalar(select(func.count()).select_from(User)) == 0 else "USER"
    user = User(email=email, name=body.name.strip(), password_hash=hash_password(body.password), role=role, status="ACTIVE")
    db.add(user)
    db.flush()
    write_audit(db, user_id=user.id, action="auth.register", resource_type="user", resource_id=str(user.id), metadata={}, ip_address=client_ip(request))
    db.commit()
    db.refresh(user)
    return _token_response(user, response)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    enforce_rate_limit(request, "auth")
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None or not verify_password(body.password, user.password_hash):
        raise AppError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401)
    if user.status != "ACTIVE":
        raise AppError("ACCOUNT_DISABLED", "This account is disabled.", 403)
    write_audit(db, user_id=user.id, action="auth.login", resource_type="user", resource_id=str(user.id), metadata={}, ip_address=client_ip(request))
    db.commit()
    return _token_response(user, response)


@router.post("/logout")
def logout(request: Request, response: Response, user: User = Depends(get_current_user)):
    token = request.cookies.get("access_token")
    header = request.headers.get("authorization", "")
    if header.lower().startswith("bearer "):
        token = header.split(" ", 1)[1]
    if token:
        payload = decode_access_token(token)
        if payload.get("jti") and payload.get("exp"):
            from datetime import datetime, timezone

            revoke(payload["jti"], datetime.fromtimestamp(payload["exp"], tz=timezone.utc))
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


def _token_response(user: User, response: Response) -> TokenResponse:
    settings = get_settings()
    token = create_access_token(str(user.id), user.role)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.app_env == "production",
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))
