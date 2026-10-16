from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from icalendar import Calendar

from events import add_timezone, daily_event, new_calendar, utc_until

LON = ZoneInfo("Europe/London")


def test_aware_dtstart_has_tzid_naive_is_floating():
    aware = daily_event("1@x", "S", datetime(2026, 1, 1, 9, 0, tzinfo=LON)).to_ical()
    assert b"DTSTART;TZID=Europe/London:20260101T090000" in aware
    naive = daily_event("2@x", "S", datetime(2026, 1, 1, 9, 0)).to_ical()
    assert b"DTSTART:20260101T090000" in naive
    assert b"TZID" not in naive


def test_rrule_roundtrip_decodes_to_lists():
    event = daily_event("1@x", "S", datetime(2026, 1, 1, tzinfo=timezone.utc), count=3)
    assert b"RRULE:FREQ=DAILY;COUNT=3" in event.to_ical()
    parsed = Calendar.from_ical(event.to_ical()).walk("VEVENT")[0]
    rule = parsed.rrules[0]
    assert rule["FREQ"] == ["DAILY"]
    assert rule["COUNT"] == [3]


def test_until_must_be_utc():
    start = datetime(2026, 1, 1, 9, 0, tzinfo=LON)
    until = datetime(2026, 1, 8, 9, 0, tzinfo=LON)
    wrong = daily_event("1@x", "S", start, until=until).to_ical()
    assert b"UNTIL=20260108T090000" in wrong
    assert b"UNTIL=20260108T090000Z" not in wrong
    right = daily_event("1@x", "S", start, until=utc_until(until)).to_ical()
    assert b"UNTIL=20260108T090000Z" in right


def test_all_day_until_type_must_match_dtstart():
    event = daily_event("1@x", "S", date(2026, 1, 1), until=date(2026, 1, 8))
    ics = event.to_ical()
    assert b"DTSTART;VALUE=DATE:20260101" in ics
    assert b"RRULE:FREQ=DAILY;UNTIL=20260108" in ics
    mixed = daily_event(
        "1@x", "S", date(2026, 1, 1), until=datetime(2026, 1, 8, tzinfo=timezone.utc)
    ).to_ical()
    assert b"UNTIL=20260108T000000Z" in mixed


def test_decoded_dtstart_is_timezone_aware():
    start = datetime(2026, 6, 1, 9, 0, tzinfo=LON)
    parsed = Calendar.from_ical(daily_event("1@x", "S", start).to_ical())
    got = parsed.walk("VEVENT")[0].decoded("dtstart")
    assert got == start
    assert got.tzinfo is not None
    assert got.utcoffset() == timedelta(hours=1)


def test_tzid_reference_needs_embedded_vtimezone():
    cal = new_calendar()
    cal.add_component(daily_event("1@x", "S", datetime(2026, 1, 1, 9, 0, tzinfo=LON)))
    assert b"TZID=Europe/London" in cal.to_ical()
    assert b"BEGIN:VTIMEZONE" not in cal.to_ical()
    add_timezone(cal, "Europe/London", date(2026, 1, 1), date(2027, 1, 1))
    ics = cal.to_ical()
    assert b"BEGIN:VTIMEZONE" in ics
    assert b"BEGIN:DAYLIGHT" in ics
    assert b"BEGIN:STANDARD" in ics
