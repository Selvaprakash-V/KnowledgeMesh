import logging

from app.config import get_settings

logger = logging.getLogger(__name__)

_client = None
_unavailable = False


def get_redis():
    global _client, _unavailable
    if _unavailable:
        raise RuntimeError("Redis is unavailable")
    if _client is not None:
        return _client
    import redis

    client = redis.Redis.from_url(
        get_settings().redis_url,
        socket_connect_timeout=0.2,
        socket_timeout=0.2,
        decode_responses=True,
    )
    try:
        client.ping()
    except Exception as exc:
        _unavailable = True
        logger.warning("Redis is unavailable (%s). Using in-process fallbacks.", type(exc).__name__)
        raise RuntimeError("Redis is unavailable") from exc
    _client = client
    return _client
