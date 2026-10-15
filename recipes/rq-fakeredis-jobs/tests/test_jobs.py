import pytest
from fakeredis import FakeStrictRedis
from rq import Queue, SimpleWorker
from rq.job import JobStatus
from jobs import send_welcome_email, explode

@pytest.fixture
def queue():
    return Queue("default", connection=FakeStrictRedis())

def test_job_runs(queue):
    job = queue.enqueue(send_welcome_email, "a@example.com")
    assert job.get_status() == JobStatus.QUEUED
    SimpleWorker([queue], connection=queue.connection).work(burst=True)
    job.refresh()
    assert job.get_status() == JobStatus.FINISHED
    assert job.return_value() == "sent to a@example.com"

def test_failed_job_lands_in_registry(queue):
    job = queue.enqueue(explode)
    SimpleWorker([queue], connection=queue.connection).work(burst=True)
    job.refresh()
    assert job.get_status() == JobStatus.FAILED
    assert job.id in queue.failed_job_registry.get_job_ids()
