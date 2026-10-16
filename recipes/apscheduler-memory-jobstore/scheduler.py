from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.schedulers.background import BackgroundScheduler


def build_scheduler(paused: bool = False) -> BackgroundScheduler:
    # MemoryJobStore holds jobs in this process only; nothing survives a restart.
    scheduler = BackgroundScheduler(
        jobstores={"default": MemoryJobStore()},
        executors={"default": ThreadPoolExecutor(2)},
        job_defaults={"coalesce": True, "max_instances": 1, "misfire_grace_time": 5},
    )
    scheduler.start(paused=paused)
    return scheduler


def schedule_interval(scheduler, func, seconds, job_id):
    return scheduler.add_job(func, "interval", seconds=seconds, id=job_id)


def schedule_once(scheduler, func, run_at, job_id):
    return scheduler.add_job(func, "date", run_date=run_at, id=job_id)
