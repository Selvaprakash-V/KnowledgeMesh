from fastapi import APIRouter

from app.api import admin, auth, chat, connectors, conversations, documents, feedback, graph, knowledge_bases, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(knowledge_bases.router)
api_router.include_router(documents.router)
api_router.include_router(chat.router)
api_router.include_router(conversations.router)
api_router.include_router(feedback.router)
api_router.include_router(admin.router)
api_router.include_router(graph.router)
api_router.include_router(connectors.router)


@api_router.get("/health", tags=["health"])
def health():
    from sqlalchemy import text

    from app.database import SessionLocal

    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
    finally:
        db.close()
    return {"status": "ok"}
