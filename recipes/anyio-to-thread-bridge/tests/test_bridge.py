import threading
import time

import anyio
import pytest
from anyio import from_thread, to_thread
from anyio.from_thread import start_blocking_portal

import bridge
from bridge import EVENTS, emit, squares_with_progress


@pytest.fixture(autouse=True)
def _clear_events():
    EVENTS.clear()
    yield
    EVENTS.clear()


async def test_to_thread_returns_result():
    assert await squares_with_progress([1, 2, 3]) == 14


async def test_worker_can_call_async_callback_in_order():
    await squares_with_progress([1, 2, 3], "scan")
    assert EVENTS == [("scan", 1), ("scan", 2), ("scan", 3)]


async def test_from_thread_run_sync_runs_on_loop_thread():
    loop_ident = threading.get_ident()
    worker_ident = await to_thread.run_sync(threading.get_ident)
    assert worker_ident != loop_ident
    assert await to_thread.run_sync(bridge.loop_thread_ident) == loop_ident


async def test_plain_thread_cannot_use_from_thread():
    errors: list[BaseException] = []

    def target():
        try:
            from_thread.run(emit, "x", 0)
        except BaseException as exc:
            errors.append(exc)

    thread = threading.Thread(target=target)
    thread.start()
    thread.join()
    assert len(errors) == 1 and isinstance(errors[0], RuntimeError)


async def test_cancel_waits_for_worker_by_default():
    finished: list[bool] = []

    def slow():
        time.sleep(0.1)
        finished.append(True)
        return 1

    with anyio.move_on_after(0.01):
        await to_thread.run_sync(slow)
    assert finished == [True]


def test_blocking_portal_bridges_plain_threads():
    with start_blocking_portal() as portal:
        assert portal.call(squares_with_progress, [2, 3], "portal") == 13
    assert ("portal", 2) in EVENTS
