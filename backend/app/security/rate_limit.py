import time
from collections import defaultdict

from fastapi import Request

from app.config import get_settings
from app.exceptions import AppError
from app.utils.redis_client import get_redis

_hits: dict[str, list[float]] = defaultdict(list)


def enforce_rate_limit(request: Request, bucket: str) -> None:
    settings = get_settings()
    limit = settings.rate_limit_per_minute
    if limit <= 0:
        return
    ip = request.client.host if request.client else "unknown"
    key = f"{bucket}:{ip}"
    try:
        client = get_redis()
        redis_key = f"rl:{key}"
        count = int(client.incr(redis_key))
        if count == 1:
            client.expire(redis_key, 60)
        if count > limit:
            raise AppError("RATE_LIMITED", "Too many requests. Try again shortly.", 429)
        return
    except AppError:
        raise
    except RuntimeError:
        pass

    now = time.time()
    window = _hits[key]
    window[:] = [stamp for stamp in window if now - stamp < 60]
    if len(window) >= limit:
        raise AppError("RATE_LIMITED", "Too many requests. Try again shortly.", 429)
    window.append(now)
