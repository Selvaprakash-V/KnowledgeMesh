import logging

from app.exceptions import PermanentIngestionError
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="ingest_document", bind=True, max_retries=2, default_retry_delay=10)
def ingest_document(self, document_id: str) -> None:
    from app.services.ingestion.pipeline import run_ingestion

    try:
        run_ingestion(document_id)
    except PermanentIngestionError:
        logger.info("Ingestion stopped for document %s", document_id)
        return
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            logger.exception("Ingestion failed for document %s", document_id)
            return
        raise self.retry(exc=exc)
