import pytest
from celery.schedules import crontab
from tasks import app, validate_beat_schedule

@pytest.fixture(autouse=True)
def eager():
    app.conf.update(task_always_eager=True, task_eager_propagates=True)
    yield
    app.conf.update(task_always_eager=False)

def test_shipped_schedule_is_valid():
    validate_beat_schedule(app.conf.beat_schedule, app.tasks)

def test_typo_in_task_name_is_caught():
    bad = {"nightly": {"task": "tasks.prnue_cache", "schedule": crontab()}}
    with pytest.raises(ValueError, match="unknown task"):
        validate_beat_schedule(bad, app.tasks)

def test_crontab_strings_expand_to_sets():
    c = crontab(minute="*/15", hour="9-11")
    assert c.minute == {0, 15, 30, 45}
    assert c.hour == {9, 10, 11}

def test_invalid_crontab_string_fails_fast():
    with pytest.raises(ValueError):
        crontab(minute="bogus")

def test_scheduled_entry_runs_eagerly():
    entry = app.conf.beat_schedule["prune-cache-nightly"]
    assert app.tasks[entry["task"]].apply_async(args=entry["args"]).get() == 0
