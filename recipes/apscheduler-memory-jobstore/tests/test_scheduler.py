import threading
import time
from datetime import datetime, timedelta, timezone

import pytest
from apscheduler.jobstores.base import ConflictingIdError
from apscheduler.jobstores.memory import MemoryJobStore

from scheduler import build_scheduler, schedule_interval, schedule_once


def test_default_jobstore_is_memory():
    s = build_scheduler()
    assert isinstance(s._jobstores["default"], MemoryJobStore)
    s.shutdown(wait=False)


def test_jobs_live_only_in_memory():
    s = build_scheduler()
    schedule_interval(s, lambda: None, 60, "tick")
    assert s.get_job("tick") is not None
    s.shutdown(wait=False)
    fresh = build_scheduler()
    assert fresh.get_job("tick") is None
    fresh.shutdown(wait=False)


def test_duplicate_id_conflicts_unless_replaced():
    s = build_scheduler()
    schedule_interval(s, lambda: None, 60, "tick")
    with pytest.raises(ConflictingIdError):
        schedule_interval(s, lambda: None, 30, "tick")
    job = s.add_job(lambda: None, "interval", seconds=30, id="tick", replace_existing=True)
    assert job.trigger.interval.total_seconds() == 30
    s.shutdown(wait=False)


def test_interval_next_run_time_is_future():
    s = build_scheduler()
    before = datetime.now(timezone.utc)
    job = schedule_interval(s, lambda: None, 5, "tick")
    assert job.next_run_time > before
    s.shutdown(wait=False)


def test_paused_scheduler_defers_until_resumed():
    ran = threading.Event()
    s = build_scheduler(paused=True)
    schedule_interval(s, ran.set, 0.05, "tick")
    assert not ran.wait(0.2)
    s.resume()
    assert ran.wait(2)
    s.shutdown(wait=False)


def test_date_job_runs_once_then_disappears():
    ran = threading.Event()
    s = build_scheduler()
    schedule_once(s, ran.set, datetime.now(timezone.utc) - timedelta(seconds=1), "once")
    assert ran.wait(2)
    for _ in range(50):
        if s.get_job("once") is None:
            break
        time.sleep(0.02)
    assert s.get_job("once") is None
    s.shutdown(wait=False)
