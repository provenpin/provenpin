import logging
from datetime import timedelta

import arq.worker
import fakeredis
import fakeredis.aioredis
import pytest
from arq import ArqRedis
from arq.jobs import JobStatus
from arq.worker import FailedJobs, JobExecutionFailed

from jobs import make_worker


async def _no_log_redis_info(*args, **kwargs):
    pass


@pytest.fixture(autouse=True)
def quiet_arq_logs():
    logging.getLogger("arq.worker").setLevel(logging.CRITICAL)


@pytest.fixture
async def pool(monkeypatch):
    # the burst Worker calls log_redis_info, and fakeredis has no INFO command
    monkeypatch.setattr(arq.worker, "log_redis_info", _no_log_redis_info)
    server = fakeredis.FakeServer()
    fake = fakeredis.aioredis.FakeRedis(server=server, decode_responses=False)
    redis = ArqRedis(connection_pool=fake.connection_pool)
    yield redis
    await redis.aclose()


async def test_worker_runs_enqueued_job(pool):
    job = await pool.enqueue_job("send_welcome", 7)
    assert await job.status() is JobStatus.queued

    worker = make_worker(pool)
    assert await worker.run_check() == 1

    assert await job.result() == "welcome:7"
    assert await job.status() is JobStatus.complete


async def test_job_can_enqueue_followup(pool):
    job = await pool.enqueue_job("notify", 5)

    worker = make_worker(pool)
    await worker.run_check()

    assert worker.jobs_complete == 2
    assert await job.result() == "notified:5"


async def test_retry_then_succeeds(pool):
    job = await pool.enqueue_job("flaky_sync", 3)

    worker = make_worker(pool)
    await worker.run_check()

    assert await job.result() == 3
    assert worker.jobs_retried == 2


async def test_retry_exhaustion_fails(pool):
    await pool.enqueue_job("flaky_sync", 99)

    worker = make_worker(pool)
    with pytest.raises(FailedJobs) as exc:
        await worker.run_check()

    assert exc.value.count == 1
    assert isinstance(exc.value.job_results[0].result, JobExecutionFailed)


async def test_deferred_job_stays_deferred(pool):
    job = await pool.enqueue_job("send_welcome", 1, _defer_by=timedelta(hours=1))

    assert await job.status() is JobStatus.deferred
    assert [j.function for j in await pool.queued_jobs()] == ["send_welcome"]


async def test_deduplicates_by_job_id(pool):
    first = await pool.enqueue_job("send_welcome", 1, _job_id="welcome-1")
    second = await pool.enqueue_job("send_welcome", 2, _job_id="welcome-1")

    assert first is not None and second is None
    assert len(await pool.queued_jobs()) == 1
