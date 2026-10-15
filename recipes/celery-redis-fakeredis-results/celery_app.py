import os
from celery import Celery

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

app = Celery("app", broker=REDIS_URL, backend=REDIS_URL)
app.conf.update(
    task_acks_late=True,           # redeliver if a worker dies mid-task
    worker_prefetch_multiplier=1,  # don't hoard long tasks on one worker
    result_expires=3600,
)
