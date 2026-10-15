import asyncio

import pytest
import pytest_asyncio

from workers import run_bounded


class FakeAPI:
    def __init__(self):
        self.closed = False
        self.active = 0
        self.peak = 0

    async def get(self, item: int) -> int:
        self.active += 1
        self.peak = max(self.peak, self.active)
        try:
            await asyncio.sleep(0.01)
            if item < 0:
                raise ValueError(f"bad item {item}")
            return item * 2
        finally:
            self.active -= 1

    async def aclose(self):
        self.closed = True


@pytest_asyncio.fixture
async def api():
    fake = FakeAPI()
    yield fake
    await fake.aclose()


@pytest.mark.asyncio
async def test_preserves_input_order(api):
    assert await run_bounded([3, 1, 2], api.get) == [6, 2, 4]


@pytest.mark.asyncio
async def test_semaphore_caps_concurrency(api):
    await run_bounded(range(10), api.get, limit=3)
    assert api.peak == 3


@pytest.mark.asyncio
async def test_failure_cancels_siblings():
    cancelled = []

    async def flaky(item: int) -> int:
        if item == 0:
            await asyncio.sleep(0.01)  # let siblings start first
            raise ValueError("boom")
        try:
            await asyncio.sleep(10)
        except asyncio.CancelledError:
            cancelled.append(item)
            raise
        return item

    with pytest.raises(ExceptionGroup) as ei:
        await run_bounded([0, 1, 2], flaky, limit=3, timeout=5)
    assert [type(e) for e in ei.value.exceptions] == [ValueError]
    assert sorted(cancelled) == [1, 2]


@pytest.mark.asyncio
async def test_timeout_surfaces_as_timeouterror_in_group():
    async def stuck(item: int) -> int:
        await asyncio.sleep(10)
        return item

    with pytest.raises(ExceptionGroup) as ei:
        await run_bounded([1], stuck, timeout=0.05)
    assert isinstance(ei.value.exceptions[0], TimeoutError)


@pytest.mark.asyncio
async def test_timeout_excludes_semaphore_wait():
    async def slow(item: int) -> int:
        await asyncio.sleep(0.03)
        return item

    # each call takes 0.03s, under the 0.05s timeout, even though the total is 0.09s
    assert await run_bounded(range(3), slow, limit=1, timeout=0.05) == [0, 1, 2]
