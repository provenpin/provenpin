import asyncio
import time

import httpx
import pytest
from aiolimiter import AsyncLimiter

from client import RateLimitedClient


def make_client(handler, max_rate=10, time_period=1.0):
    return RateLimitedClient(max_rate, time_period, transport=httpx.MockTransport(handler))


async def test_parses_json_offline():
    seen = []

    def handler(request):
        seen.append(request.url.path)
        return httpx.Response(200, json={"path": request.url.path})

    c = make_client(handler)
    assert await c.get_json("/repos/a/b") == {"path": "/repos/a/b"}
    assert seen == ["/repos/a/b"]
    await c.aclose()


async def test_http_error_propagates():
    c = make_client(lambda request: httpx.Response(500))
    with pytest.raises(httpx.HTTPStatusError):
        await c.get_json("/boom")
    await c.aclose()


async def test_initial_burst_is_free():
    c = make_client(lambda request: httpx.Response(200, json={}), max_rate=3, time_period=1.0)
    start = time.monotonic()
    for _ in range(3):
        await c.get_json("/x")
    assert time.monotonic() - start < 0.2
    await c.aclose()


async def test_gather_is_throttled():
    c = make_client(lambda request: httpx.Response(200, json={}), max_rate=1, time_period=0.2)
    start = time.monotonic()
    await asyncio.gather(*(c.get_json(f"/x{i}") for i in range(3)))
    assert time.monotonic() - start >= 0.35
    await c.aclose()


async def test_acquire_amount_over_capacity_raises():
    limiter = AsyncLimiter(max_rate=2, time_period=1)
    with pytest.raises(ValueError):
        await limiter.acquire(amount=3)


def test_limiter_reuse_across_event_loops_warns():
    limiter = AsyncLimiter(max_rate=1, time_period=1)

    async def use():
        async with limiter:
            pass

    asyncio.run(use())
    with pytest.warns(RuntimeWarning, match="re-used across loops"):
        asyncio.run(use())
