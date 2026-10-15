import threading

from anyio import from_thread, to_thread

EVENTS: list[tuple[str, int]] = []


async def emit(label: str, count: int) -> None:
    EVENTS.append((label, count))


def crunch(nums: list[int], label: str) -> int:
    total = 0
    for done, value in enumerate(nums, start=1):
        total += value * value
        from_thread.run(emit, label, done)
    return total


async def squares_with_progress(nums: list[int], label: str = "job") -> int:
    return await to_thread.run_sync(crunch, nums, label)


def loop_thread_ident() -> int:
    return from_thread.run_sync(threading.get_ident)
