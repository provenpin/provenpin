import hashlib
import json
from pathlib import Path
from typing import Any, Callable

from diskcache import FanoutCache
from filelock import FileLock

MISSING = object()


def job_key(name: str, *args: Any) -> str:
    payload = json.dumps([name, args], sort_keys=True, default=repr)
    digest = hashlib.sha256(payload.encode()).hexdigest()[:16]
    return f"{name}-{digest}"


class JobCache:
    def __init__(self, directory: str, shards: int = 4, timeout: float = 1.0, lock_timeout: float = 5.0):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)
        (self.directory / "locks").mkdir(parents=True, exist_ok=True)
        self.cache = FanoutCache(str(self.directory / "cache"), shards=shards, timeout=timeout)
        self.lock_timeout = lock_timeout
        self._locks: dict[str, FileLock] = {}

    def _lock(self, key: str) -> FileLock:
        lock = self._locks.get(key)
        if lock is None:
            lock = self._locks[key] = FileLock(str(self.directory / "locks" / f"{key}.lock"), timeout=self.lock_timeout)
        return lock

    def run_once(self, name: str, func: Callable[..., Any], *args: Any, expire: float | None = None) -> Any:
        key = job_key(name, *args)
        hit = self.cache.get(key, default=MISSING)
        if hit is not MISSING:
            return hit
        with self._lock(key):
            hit = self.cache.get(key, default=MISSING)
            if hit is not MISSING:
                return hit
            value = func(*args)
            self.cache.set(key, value, expire=expire)
            return value

    def claim(self, name: str, *args: Any) -> bool:
        return self.cache.add(job_key(name, *args), True)

    def close(self) -> None:
        self.cache.close()
