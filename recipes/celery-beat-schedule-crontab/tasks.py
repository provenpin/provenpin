from celery import Celery
from celery.schedules import crontab

app = Celery("tasks", broker="memory://", backend="cache+memory://")

@app.task
def prune_cache(max_age_hours: int) -> int:
    # real code would delete stale rows and return how many were removed
    return 0

@app.task
def send_report(recipients: list[str]) -> int:
    return len(recipients)

app.conf.beat_schedule = {
    "prune-cache-nightly": {
        "task": "tasks.prune_cache",
        "schedule": crontab(hour=3, minute=0),
        "args": (24,),
    },
    "report-weekdays": {
        "task": "tasks.send_report",
        "schedule": crontab(minute="*/30", hour="9-17", day_of_week="mon-fri"),
        "args": (["ops@example.com"],),
    },
}

def validate_beat_schedule(schedule: dict, known_tasks) -> None:
    # beat only fails at runtime in the worker, so check names and types up front
    for name, entry in schedule.items():
        if entry["task"] not in known_tasks:
            raise ValueError(f"{name}: unknown task {entry['task']!r}")
        if not isinstance(entry["schedule"], crontab):
            raise ValueError(f"{name}: schedule must be a crontab")
