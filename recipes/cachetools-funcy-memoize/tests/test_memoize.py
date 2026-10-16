import pytest
from cachetools import TTLCache

from memoize import fetch_or_default, retrying_loader, ttl_memoize


class Clock:
    def __init__(self, now=100.0):
        self.now = now

    def __call__(self):
        return self.now


class Loader:
    def __init__(self, fail_times=0, value=42):
        self.fail_times = fail_times
        self.value = value
        self.calls = []

    def __call__(self, key):
        self.calls.append(key)
        if len(self.calls) <= self.fail_times:
            raise RuntimeError("flaky")
        return self.value


def test_ttl_expiry_recomputes_with_injected_clock():
    clock = Clock()
    loader = Loader()
    load = retrying_loader(loader, ttl=10.0, timer=clock)
    assert load("a") == 42
    assert load("a") == 42
    assert loader.calls == ["a"]
    clock.now += 10.0
    assert load("a") == 42
    assert loader.calls == ["a", "a"]
    assert load.memory.currsize == 1


def test_membership_check_does_not_prune_but_expire_does():
    clock = Clock()
    cache = TTLCache(maxsize=8, ttl=5.0, timer=clock)
    cache["a"] = 1
    clock.now += 10.0
    assert "a" not in cache
    assert cache.expire() == [("a", 1)]
    assert len(cache) == 0


def test_unhashable_args_need_an_explicit_key():
    @ttl_memoize(ttl=60.0)
    def lookup(row):
        return row["id"]

    with pytest.raises(TypeError):
        lookup({"id": 1})

    seen = []

    @ttl_memoize(ttl=60.0, key=lambda row: row["id"])
    def keyed(row):
        seen.append(row["id"])
        return row["id"] * 10

    assert keyed({"id": 1, "v": "x"}) == 10
    assert keyed({"id": 1, "v": "y"}) == 10
    assert seen == [1]


def test_positional_and_keyword_calls_are_distinct_keys():
    calls = []

    @ttl_memoize(ttl=60.0)
    def add(a, b):
        calls.append((a, b))
        return a + b

    assert add(1, b=2) == 3
    assert add(1, 2) == 3
    assert add(a=1, b=2) == 3
    assert calls == [(1, 2), (1, 2), (1, 2)]


def test_funcy_retry_memoizes_only_success():
    loader = Loader(fail_times=2)
    load = retrying_loader(loader, ttl=60.0, tries=3)
    assert load("a") == 42
    assert len(loader.calls) == 3
    assert load("a") == 42
    assert len(loader.calls) == 3


def test_funcy_fallback_default_is_not_cached():
    loader = Loader(fail_times=99)
    load = retrying_loader(loader, ttl=60.0, tries=2)
    assert fetch_or_default(load, "a", "n/a") == "n/a"
    loader.fail_times = 0
    assert fetch_or_default(load, "a", "n/a") == 42
    assert fetch_or_default(load, "a", "n/a") == 42
    assert loader.calls == ["a", "a", "a"]
