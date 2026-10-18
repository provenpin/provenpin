import asyncio

from aiocache import Cache, cached


def build_cache(namespace=None, ttl=None, key_builder=None):
    return Cache(Cache.MEMORY, namespace=namespace, ttl=ttl, key_builder=key_builder)


def make_square(ttl=60.0, namespace="calc"):
    stats = {"calls": 0}

    @cached(ttl=ttl, namespace=namespace)
    async def square(n):
        stats["calls"] += 1
        await asyncio.sleep(0)
        return n * n

    return square, stats


def make_article_lookup(rows, namespace="blog"):
    stats = {"calls": 0}

    @cached(
        ttl=60,
        namespace=namespace,
        key_builder=lambda func, slug, **kwargs: f"{func.__name__}:{slug}",
    )
    async def article(slug):
        stats["calls"] += 1
        return rows[slug]

    return article, stats


class RepoClient:
    def __init__(self, owner):
        self.owner = owner
        self.calls = 0

    @cached(ttl=60, namespace="repo", noself=True)
    async def repo(self, name):
        self.calls += 1
        return f"{self.owner}/{name}"
