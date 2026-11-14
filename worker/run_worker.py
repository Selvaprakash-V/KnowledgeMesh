import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.workers.celery_app import celery_app

if __name__ == "__main__":
    argv = ["worker", "--loglevel=INFO"]
    if os.name == "nt":
        argv.extend(["--pool", "solo"])
    celery_app.worker_main(argv=argv)
