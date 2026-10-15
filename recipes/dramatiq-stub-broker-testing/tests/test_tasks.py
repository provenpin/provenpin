import asyncio

import pytest
from dramatiq.results.errors import ResultFailure, ResultMissing
from dramatiq.worker import Worker

from tasks import add, broker, divide, square, upper


@pytest.fixture
def worker():
    w = Worker(broker, worker_timeout=100, worker_threads=1)
    w.start()
    yield w
    w.stop()
    broker.dead_letters_by_queue.clear()


def test_actor_runs_on_worker(worker):
    message = add.send(2, 3)
    broker.join(add.queue_name)
    assert message.get_result(backend=broker.get_results_backend()) == 5


def test_result_missing_without_store_results(worker):
    message = square.send(4)
    broker.join(square.queue_name)
    with pytest.raises(ResultMissing):
        message.get_result(backend=broker.get_results_backend())


def test_join_fail_fast_reraises_actor_error(worker):
    divide.send(1, 0)
    with pytest.raises(ZeroDivisionError):
        broker.join(divide.queue_name, fail_fast=True)


def test_result_failure_after_non_fail_fast_join(worker):
    message = divide.send(1, 0)
    broker.join(divide.queue_name, fail_fast=False)
    with pytest.raises(ResultFailure) as exc:
        message.get_result(backend=broker.get_results_backend(), block=True)
    assert "ZeroDivisionError" in str(exc.value)


async def test_async_actor_result_is_retrieved_from_a_thread(worker):
    message = upper.send("abc")
    await asyncio.to_thread(broker.join, upper.queue_name)
    result = await asyncio.to_thread(message.get_result, backend=broker.get_results_backend(), block=True)
    assert result == "ABC"
