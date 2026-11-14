import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select

from app.api.router import api_router
from app.config import get_settings, validate_runtime
from app.database import SessionLocal
from app.exceptions import AppError
from app.logging_config import configure_logging
from app.models import User
from app.security.passwords import hash_password
from app.utils.request_context import get_request_id, reset_request_id, set_request_id

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    settings = get_settings()
    validate_runtime(settings)
    if settings.auto_migrate:
        _migrate()
    _bootstrap_admin()
    yield
    from app.services.graph.store import close_graph_store

    close_graph_store()


class RequestContextMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request_id = str(uuid.uuid4())
        for key, value in scope.get("headers") or []:
            if key == b"x-request-id" and value:
                request_id = value.decode()
        token = set_request_id(request_id)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers") or [])
                headers.extend(
                    [
                        (b"x-request-id", request_id.encode()),
                        (b"x-content-type-options", b"nosniff"),
                        (b"x-frame-options", b"DENY"),
                        (b"referrer-policy", b"no-referrer"),
                        (b"permissions-policy", b"geolocation=(), camera=(), microphone=()"),
                        (b"cross-origin-opener-policy", b"same-origin"),
                    ]
                )
                message = {**message, "headers": headers}
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            reset_request_id(token)


app = FastAPI(title="KnowledgeMesh", version="1.0.0", summary="Hybrid GraphRAG knowledge intelligence API", lifespan=lifespan)
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestContextMiddleware)
app.include_router(api_router, prefix="/api")


@app.exception_handler(AppError)
async def handle_app_error(_: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content=_error(exc.code, exc.message))


@app.exception_handler(RequestValidationError)
async def handle_validation(_: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content=_error("VALIDATION_ERROR", "Request validation failed.", exc.errors()))


@app.exception_handler(Exception)
async def handle_unexpected(_: Request, exc: Exception):
    logger.exception("Unhandled error")
    return JSONResponse(status_code=500, content=_error("INTERNAL_ERROR", "Something went wrong."))


@app.get("/")
def root():
    return {"name": "KnowledgeMesh", "docs": "/docs"}


def _error(code: str, message: str, details=None) -> dict:
    payload = {"code": code, "message": message, "request_id": get_request_id()}
    if details is not None:
        payload["details"] = details
    return {"error": payload}


def _migrate() -> None:
    from pathlib import Path

    from alembic import command
    from alembic.config import Config

    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", get_settings().database_url.replace("%", "%%"))
    command.upgrade(config, "head")


def _bootstrap_admin() -> None:
    current = get_settings()
    if not current.bootstrap_admin_email or not current.bootstrap_admin_password:
        return
    if len(current.bootstrap_admin_password) < 8:
        logger.error("BOOTSTRAP_ADMIN_PASSWORD is too short; admin was not created")
        return
    db = SessionLocal()
    try:
        email = current.bootstrap_admin_email.lower()
        if db.scalar(select(User).where(User.email == email)):
            return
        if db.scalar(select(func.count()).select_from(User)):
            logger.info("Skipping bootstrap admin because users already exist")
            return
        db.add(
            User(
                email=email,
                name=current.bootstrap_admin_name,
                password_hash=hash_password(current.bootstrap_admin_password),
                role="ADMIN",
                status="ACTIVE",
            )
        )
        db.commit()
    finally:
        db.close()


