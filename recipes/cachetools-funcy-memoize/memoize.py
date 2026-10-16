import time

import funcy
from cachetools import TTLCache


def ttl_memoize(ttl, maxsize=128, key=None, timer=time.monotonic):
    cache = TTLCache(maxsize=maxsize, ttl=ttl, timer=timer)

    def decorate(func):
        @funcy.wraps(func)
        def wrapper(*args, **kwargs):
            k = key(*args, **kwargs) if key else args + tuple(sorted(kwargs.items()))
            try:
                return cache[k]
            except KeyError:
                cache[k] = value = func(*args, **kwargs)
                return value

        wrapper.memory = cache
        wrapper.invalidate_all = cache.clear
        return wrapper

    return decorate


def retrying_loader(loader, ttl=30.0, timer=time.monotonic, tries=3):
    @funcy.retry(tries=tries, timeout=0)
    @ttl_memoize(ttl=ttl, timer=timer)
    def load(key):
        return loader(key)

    return load


def fetch_or_default(load, key, default):
    return funcy.fallback(lambda: load(key), lambda: default)
