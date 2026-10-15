from datetime import datetime, UTC
from zoneinfo import ZoneInfo

from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

TZ = ZoneInfo("America/New_York")

def report_trigger() -> CronTrigger:
    return CronTrigger(hour=9, minute=0, timezone=TZ)

def heartbeat_trigger(start: datetime | None = None) -> IntervalTrigger:
    return IntervalTrigger(minutes=15, start_date=start, timezone=UTC)

def next_report(now: datetime | None = None) -> datetime:
    if now is None:
        now = datetime.now(TZ)
    return report_trigger().get_next_fire_time(None, now)

def upcoming(trigger, now: datetime, count: int) -> list[datetime]:
    fire = trigger.get_next_fire_time(None, now)
    out = []
    while fire is not None and len(out) < count:
        out.append(fire)
        fire = trigger.get_next_fire_time(fire, fire)
    return out
