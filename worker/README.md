# The worker runs the Celery application defined in `backend/app/workers`.
# From the repository root, with the backend virtualenv active:

```bash
python worker/run_worker.py
```

On Windows the script selects the solo pool. In Docker, the worker service uses the backend image and Celery's default prefork pool.
