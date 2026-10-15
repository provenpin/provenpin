import tempfile
from pathlib import Path

from huey import SqliteHuey

# A real file is required: SqliteStorage closes its connection after creating
# the schema, so filename=":memory:" would silently lose the tables.
DB = Path(tempfile.mkdtemp()) / "huey.sqlite"

# immediate_use_memory defaults to True, which silently swaps the sqlite
# storage for an in-memory broker as soon as immediate mode is on.
huey = SqliteHuey(
    "tasks",
    filename=str(DB),
    immediate=True,
    immediate_use_memory=False,
)

@huey.task()
def add(x, y):
    return x + y

@huey.task()
def boom():
    raise ValueError("nope")

@huey.task(retries=2, context=True)
def flaky(task):
    if task.retries:
        raise ValueError("retry")
    return "done"

def drain(huey, limit=50):
    # Minimal consumer stub: pull queued tasks and run them inline.
    executed = 0
    while executed < limit:
        task = huey.dequeue()
        if task is None:
            break
        huey.execute(task)
        executed += 1
    return executed

def run_schedule(huey, timestamp=None):
    # The scheduler only moves due tasks from the schedule table to the queue.
    for task in huey.read_schedule(timestamp):
        huey.enqueue(task)
