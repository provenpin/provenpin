from cachetools import LRUCache, TTLCache, cached, cachedmethod


def build_square(timer, ttl=10.0, maxsize=128):
    cache = TTLCache(maxsize=maxsize, ttl=ttl, timer=timer)
    stats = {"calls": 0}

    @cached(cache)
    def square(n):
        stats["calls"] += 1
        return n * n

    return square, cache, stats


def build_row_lookup(rows):
    cache = TTLCache(maxsize=8, ttl=60)

    @cached(cache, key=lambda row: row["id"])
    def lookup(row):
        return rows[row["id"]]

    return lookup, cache


class RepoClient:
    shared = TTLCache(maxsize=32, ttl=60)

    def __init__(self, owner):
        self.owner = owner
        self.calls = 0

    @cachedmethod(lambda self: self.shared)
    def repo(self, name):
        self.calls += 1
        return f"{self.owner}/{name}"


def build_lru(maxsize=2):
    return LRUCache(maxsize=maxsize)
