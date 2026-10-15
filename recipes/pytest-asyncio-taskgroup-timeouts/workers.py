import asyncio
from collections.abc import Awaitable, Callable, Iterable

Getter = Callable[[int], Awaitable[int]]

async def run_bounded(items: Iterable[int], get: Getter, limit: int = 3, timeout: float = 1.0) -> list[int]:
    items = list(items)
    sem = asyncio.Semaphore(limit)
    results: dict[int, int] = {}

    async def worker(i: int, item: int) -> None:
        async with sem:  # bounds concurrent calls, not task creation
            # timeout starts after the semaphore is acquired, so queue wait is not counted
            async with asyncio.timeout(timeout):
                results[i] = await get(item)

    # first failure cancels siblings and raises an ExceptionGroup
    async with asyncio.TaskGroup() as tg:
        for i, item in enumerate(items):
            tg.create_task(worker(i, item))
    return [results[i] for i in range(len(items))]
