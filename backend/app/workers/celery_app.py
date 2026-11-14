import logging

from celery import Celery

from app.config import get_settings

settings = get_settings()
celery_app = Celery("knowledgemesh", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_track_started=True,
    broker_connection_retry_on_startup=True,
    broker_connection_timeout=3,
    imports=["app.workers.tasks"],
)
logger = logging.getLogger(__name__)
