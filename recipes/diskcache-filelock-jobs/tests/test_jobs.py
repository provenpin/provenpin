import threading

import diskcache
import pytest
from filelock import Timeout as FileLockTimeout

from jobs import JobCache, job_key


@pytest.fixture
def jobs(tmp_path):
    cache = JobCache(tmp_path)
    yield cache
    cache.close()


def test_run_once_computes_once_and_reuses_result(jobs):
    calls = []

    def work(x):
        calls.append(x)
        return x * 2

    assert jobs.run_once("double", work, 21) == 42
    assert jobs.run_once("double", work, 21) == 42
    assert calls == [21]


def test_cached_none_is_a_hit_not_a_miss(jobs):
    calls = []

    def returns_none():
        calls.append(1)

    assert jobs.run_once("noop", returns_none) is None
    assert jobs.run_once("noop", returns_none) is None
    assert len(calls) == 1


def test_zero_expire_means_expire_now_not_forever(jobs):
    calls = []

    def work():
        calls.append(1)
        return "v"

    assert jobs.run_once("ttl", work, expire=0) == "v"
    assert jobs.run_once("ttl", work, expire=0) == "v"
    assert len(calls) == 2


def test_concurrent_callers_compute_once(jobs):
    barrier = threading.Barrier(2)
    calls = []
    results = {}

    def slow(x):
        calls.append(x)
        return x

    def run(tag):
        barrier.wait(timeout=5)
        results[tag] = jobs.run_once("slow", slow, "k")

    threads = [threading.Thread(target=run, args=(i,)) for i in range(2)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert calls == ["k"]
    assert results == {0: "k", 1: "k"}


def test_lock_contention_raises_filelock_timeout(tmp_path):
    jobs = JobCache(tmp_path, lock_timeout=0.1)
    inside = threading.Event()
    release = threading.Event()

    def slow():
        inside.set()
        release.wait(5)
        return "done"

    holder = threading.Thread(target=lambda: jobs.run_once("slow", slow))
    holder.start()
    assert inside.wait(5)

    with pytest.raises(FileLockTimeout):
        jobs.run_once("slow", lambda: "other")
    assert not issubclass(FileLockTimeout, diskcache.Timeout)

    release.set()
    holder.join()
    assert jobs.cache.get(job_key("slow")) == "done"
    jobs.close()


def test_claim_is_atomic_and_keys_are_stable(jobs):
    assert jobs.claim("build", {"a": 1, "b": 2}) is True
    assert jobs.claim("build", {"b": 2, "a": 1}) is False
    assert job_key("f", {"a": 1, "b": 2}) == job_key("f", {"b": 2, "a": 1})
    assert job_key("f", 1) != job_key("f", 2)
