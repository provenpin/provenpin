from __future__ import annotations

import threading
from collections.abc import Iterator, MutableMapping
from typing import Any, Callable

from cachetools import LRUCache
from cachetools.keys import hashkey
from diskcache import FanoutCache

MISSING = object()


class TieredCache(MutableMapping):
    """L1 cachetools.LRUCache promoted from an L2 diskcache.FanoutCache."""

    def __init__(self, directory: str, maxsize: int = 128, shards: int = 4, size_limit: int = 1 << 24):
        self.memory: LRUCache = LRUCache(maxsize=maxsize)
        self.disk: FanoutCache = FanoutCache(directory, shards=shards, size_limit=size_limit)
        self._lock = threading.RLock()
        self.stats = {"memory": 0, "disk": 0, "miss": 0}

    def __getitem__(self, key: Any) -> Any:
        with self._lock:
            if key in self.memory:
                self.stats["memory"] += 1
                return self.memory[key]
        value = self.disk.get(key, default=MISSING)
        if value is MISSING:
            self.stats["miss"] += 1
            raise KeyError(key)
        with self._lock:
            self.memory[key] = value
        self.stats["disk"] += 1
        return value

    def __setitem__(self, key: Any, value: Any) -> None:
        self.set(key, value)

    def __delitem__(self, key: Any) -> None:
        with self._lock:
            self.memory.pop(key, None)
        del self.disk[key]

    def __iter__(self) -> Iterator[Any]:
        return iter(self.disk)

    def __len__(self) -> int:
        return len(self.disk)

    def set(self, key: Any, value: Any, expire: float | None = None) -> None:
        with self._lock:
            self.memory[key] = value
        self.disk.set(key, value, expire=expire)

    def hits(self) -> tuple[int, int]:
        return self.stats["memory"], self.stats["disk"]

    def close(self) -> None:
        self.disk.close()

    def __enter__(self) -> "TieredCache":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()


def memoize(cache: MutableMapping, key: Callable[..., Any] = hashkey):
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            cache_key = key(*args, **kwargs)
            try:
                return cache[cache_key]
            except KeyError:
                value = func(*args, **kwargs)
                cache[cache_key] = value
                return value

        wrapper.cache = cache  # type: ignore[attr-defined]
        return wrapper

    return decorator
