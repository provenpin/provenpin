import datetime

import pytest
from huey.exceptions import TaskException
from huey.storage import SqliteStorage

from tasks import add, boom, drain, flaky, huey, run_schedule

@pytest.fixture(autouse=True)
def isolated():
    huey.immediate = True
    huey.storage.flush_all()
    yield
    huey.storage.flush_all()
    huey.immediate = True

def test_immediate_runs_inline_on_sqlite():
    # immediate_use_memory=False keeps the sqlite storage even in immediate mode.
    assert isinstance(huey.storage, SqliteStorage)
    result = add(2, 3)
    # get() pops the stored result by default; preserve=True keeps it around.
    assert result.get(preserve=True) == 5
    assert huey.storage.result_store_size() == 1

def test_consumer_stub_drains_the_queue():
    huey.immediate = False
    result = add(1, 2)
    assert huey.storage.queue_size() == 1
    assert result.get() is None
    assert drain(huey) == 1
    assert result.get() == 3
    assert huey.storage.queue_size() == 0

def test_error_is_stored_then_raised_by_get():
    result = boom()
    assert huey.storage.result_store_size() == 1
    with pytest.raises(TaskException) as exc:
        result.get()
    assert exc.value.metadata["error"] == "ValueError('nope')"

def test_retries_re_run_inline_until_success():
    # flaky uses context=True and raises while task.retries is truthy.
    assert flaky().get() == "done"

def test_scheduled_tasks_need_the_scheduler_stub(monkeypatch):
    huey.immediate = False
    result = add.schedule(args=(4, 5), delay=60)
    assert drain(huey) == 1  # worker runs, sees the future eta, parks it
    assert huey.storage.queue_size() == 0
    assert huey.storage.schedule_size() == 1
    assert result.get() is None
    later = huey._get_timestamp() + datetime.timedelta(seconds=120)
    monkeypatch.setattr(huey, "_get_timestamp", lambda: later)
    run_schedule(huey)  # scheduler stub promotes due tasks back to the queue
    assert huey.storage.schedule_size() == 0
    assert drain(huey) == 1
    assert result.get() == 9
