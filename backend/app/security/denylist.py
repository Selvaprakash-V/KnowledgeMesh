from datetime import datetime, timezone

from app.utils.redis_client import get_redis

_memory: dict[str, datetime] = {}


def revoke(jti: str, expires_at: datetime) -> None:
    ttl = int((expires_at - datetime.now(timezone.utc)).total_seconds())
    if ttl <= 0:
        return
    try:
        get_redis().setex(f"denylist:{jti}", ttl, "1")
        return
    except RuntimeError:
        _memory[jti] = expires_at


def is_revoked(jti: str) -> bool:
    try:
        return bool(get_redis().get(f"denylist:{jti}"))
    except RuntimeError:
        expiry = _memory.get(jti)
        if expiry is None:
            return False
        if expiry <= datetime.now(timezone.utc):
            _memory.pop(jti, None)
            return False
        return True
