import pytest
from cachetools import TTLCache, cached

from memoize import RepoClient, build_lru, build_row_lookup, build_square


def test_ttl_expiry_recomputes():
    now = [100.0]
    square, cache, stats = build_square(timer=lambda: now[0], ttl=10.0)
    assert square(3) == 9
    assert square(3) == 9
    assert stats["calls"] == 1
    now[0] += 10.0
    assert square(3) == 9
    assert stats["calls"] == 2
    assert cache.currsize == 1


def test_unhashable_args_raise_with_default_key():
    cache = TTLCache(maxsize=8, ttl=60)

    @cached(cache)
    def lookup(row):
        return row["id"]

    with pytest.raises(TypeError):
        lookup({"id": 1})


def test_custom_key_memoizes_unhashable_args():
    seen = []

    @cached(TTLCache(maxsize=8, ttl=60), key=lambda row: row["id"])
    def lookup(row):
        seen.append(row["id"])
        return row["id"] * 10

    assert lookup({"id": 1, "v": "a"}) == 10
    assert lookup({"id": 1, "v": "b"}) == 10
    assert seen == [1]


def test_row_lookup_stores_one_entry_per_id():
    lookup, cache = build_row_lookup({1: "one", 2: "two"})
    assert lookup({"id": 1}) == "one"
    assert lookup({"id": 2}) == "two"
    assert cache.currsize == 2


def test_lru_membership_does_not_refresh_recency():
    cache = build_lru(maxsize=2)
    cache["a"] = 1
    cache["b"] = 2
    assert "a" in cache
    cache["c"] = 3
    assert "a" not in cache
    assert set(cache.keys()) == {"b", "c"}


def test_cachedmethod_shared_cache_ignores_self():
    RepoClient.shared.clear()
    alice, bob = RepoClient("alice"), RepoClient("bob")
    assert alice.repo("x") == "alice/x"
    assert bob.repo("x") == "alice/x"
    assert bob.calls == 0
