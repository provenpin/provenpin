import time

import pytest
from cachetools import cached

from tiered import TieredCache, memoize


def test_cached_memory_hit_skips_disk(tmp_path):
    with TieredCache(tmp_path, maxsize=8) as cache:
        calls = []

        @cached(cache)
        def square(n):
            calls.append(n)
            return n * n

        assert square(4) == 16
        assert square(4) == 16
        assert calls == [4]
        assert cache.stats["memory"] == 1
        assert cache.stats["disk"] == 0


def test_lru_eviction_falls_back_to_disk_and_repromotes(tmp_path):
    with TieredCache(tmp_path, maxsize=1) as cache:
        cache["a"] = 1
        cache["b"] = 2
        assert "a" not in cache.memory
        assert cache["a"] == 1
        assert "a" in cache.memory
        assert "b" not in cache.memory
        assert cache.stats["disk"] == 1


def test_stored_none_is_a_hit_but_missing_uses_default(tmp_path):
    with TieredCache(tmp_path, maxsize=8) as cache:
        cache["k"] = None
        cache.memory.clear()
        assert cache.get("k", "fallback") is None
        assert cache.get("missing", "fallback") == "fallback"
        assert cache.stats["miss"] == 1


def test_disk_tier_survives_reopen(tmp_path):
    first = TieredCache(tmp_path, maxsize=2)
    first["k"] = {"n": 1}
    first.close()

    second = TieredCache(tmp_path, maxsize=2)
    try:
        assert dict(second.memory) == {}
        assert second["k"] == {"n": 1}
        assert second.stats["disk"] == 1
    finally:
        second.close()


def test_memory_tier_ignores_disk_ttl(tmp_path):
    with TieredCache(tmp_path, maxsize=8) as cache:
        cache.set("k", "v", expire=0.05)
        time.sleep(0.12)
        assert cache.disk.get("k") is None
        assert cache["k"] == "v"


def test_memoize_reuses_disk_after_memory_eviction(tmp_path):
    with TieredCache(tmp_path, maxsize=1) as cache:
        calls = []

        @memoize(cache)
        def add(x, y):
            calls.append((x, y))
            return x + y

        assert add(2, 3) == 5
        cache["unrelated"] = 1
        assert add(2, 3) == 5
        assert calls == [(2, 3)]
        assert cache.stats["disk"] == 1
