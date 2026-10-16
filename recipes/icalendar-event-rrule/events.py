from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from icalendar import Calendar, Event, Timezone


def new_calendar() -> Calendar:
    cal = Calendar()
    cal.add("prodid", "-//ProvenPin//icalendar-event-rrule//EN")
    cal.add("version", "2.0")
    return cal


def add_timezone(cal: Calendar, tzid: str, first: date, last: date) -> None:
    cal.add_component(
        Timezone.from_tzinfo(ZoneInfo(tzid), first_date=first, last_date=last)
    )


def daily_event(
    uid: str,
    summary: str,
    dtstart: date | datetime,
    count: int = 3,
    until: date | datetime | None = None,
) -> Event:
    event = Event()
    event.add("uid", uid)
    event.add("summary", summary)
    event.add("dtstart", dtstart)
    rule: dict = {"freq": "daily"}
    if until is not None:
        rule["until"] = until
    else:
        rule["count"] = count
    event.add("rrule", rule)
    return event


def utc_until(dt: datetime) -> datetime:
    return dt.astimezone(timezone.utc)
