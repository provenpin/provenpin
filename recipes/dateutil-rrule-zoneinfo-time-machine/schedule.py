from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from dateutil.rrule import DAILY, rrule

NY = ZoneInfo("America/New_York")

def daily_at(start: datetime, hour: int, minute: int) -> rrule:
    """Every day at hour:minute wall-clock time. start must be timezone-aware."""
    return rrule(DAILY, dtstart=start, byhour=hour, byminute=minute, bysecond=0)

def next_run(rule: rrule, now: datetime) -> datetime:
    return rule.after(now, inc=False)

def to_utc(dt: datetime) -> datetime:
    return dt.astimezone(timezone.utc)
