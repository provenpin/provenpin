import asyncio

import pytest
from aiocache import Cache, cached

from memory_cache import RepoClient, build_cache, make_article_lookup, make_square


async def test_cached_ttl_expiry_recomputes():
    square, stats = make_square(ttl=0.05)
    assert await square(3) == 9
    assert await square(3) == 9
    assert stats["calls"] == 1
    await asyncio.sleep(0.15)
    assert await square(3) == 9
    assert stats["calls"] == 2


async def test_cached_distinct_args_cached_separately():
    square, stats = make_square(namespace="calc")
    assert await square(2) == 4
    assert await square(3) == 9
    assert await square(2) == 4
    assert stats["calls"] == 2
    assert square.cache.namespace == "calc"
    assert square.cache.build_key("k", namespace=square.cache.namespace) == "calck"


async def test_namespace_isolation_and_key_builder():
    billing = build_cache(namespace="billing")
    shipping = build_cache(namespace="shipping")
    await billing.set("total", 41)
    assert await billing.get("total") == 41
    assert await shipping.get("total") is None

    def upper_key(key, namespace=None):
        return f"{namespace or ''}:{key}".upper()

    users = build_cache(namespace="users", key_builder=upper_key)
    await users.set("1", "amy")
    assert await users.get("1") == "amy"
    assert users.build_key("1", namespace="users") == "USERS:1"


async def test_decorator_key_builder_memoizes_by_slug():
    rows = {"intro": {"slug": "intro", "title": "Intro"}}
    article, stats = make_article_lookup(rows)
    assert await article("intro") == {"slug": "intro", "title": "Intro"}
    assert await article("intro") == {"slug": "intro", "title": "Intro"}
    assert stats["calls"] == 1


async def test_skip_cache_func_does_not_store_none():
    stats = {"calls": 0}

    @cached(ttl=60, skip_cache_func=lambda result: result is None)
    async def maybe(name):
        stats["calls"] += 1
        return None if name == "missing" else name.upper()

    await maybe("missing")
    await maybe("missing")
    assert stats["calls"] == 2
    await maybe("amy")
    await maybe("amy")
    assert stats["calls"] == 3


async def test_noself_shares_cache_across_instances():
    await RepoClient.repo.cache.clear()
    alice, bob = RepoClient("alice"), RepoClient("bob")
    assert await alice.repo("x") == "alice/x"
    assert await bob.repo("x") == "alice/x"
    assert bob.calls == 0


def test_cached_rejects_cache_instance():
    with pytest.raises(TypeError):

        @cached(ttl=60, cache=Cache(Cache.MEMORY)())
        async def token():
            return "t"
