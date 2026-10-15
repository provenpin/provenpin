import os
import redis

class IdempotencyLock:
    def __init__(self, client: redis.Redis, ttl: int = 3600, prefix: str = "idem:"):
        self.client = client
        self.ttl = ttl
        self.prefix = prefix

    def claim(self, key: str) -> bool:
        # SET NX returns True on success and None when the key already exists
        return bool(self.client.set(self.prefix + key, "1", nx=True, ex=self.ttl))

    def release(self, key: str) -> None:
        self.client.delete(self.prefix + key)

_default: IdempotencyLock | None = None

def get_lock() -> IdempotencyLock:
    global _default
    if _default is None:
        url = os.environ.get("REDIS_URL", "redis://localhost:6379/1")
        _default = IdempotencyLock(redis.Redis.from_url(url))
    return _default
