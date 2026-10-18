import pytest
import whenever as w

from scheduling import (
    calendar_deadline,
    calendar_months,
    elapsed_hours,
    exact_deadline,
    wall_clock,
)

def test_fall_back_fold_needs_disambiguation():
    earlier = wall_clock("2024-11-03T01:30", "America/New_York", disambiguation="earlier")
    later = wall_clock("2024-11-03T01:30", "America/New_York", disambiguation="later")
    assert earlier.offset == w.hours(-4) and later.offset == w.hours(-5)
    assert earlier.is_repeated() and later.is_repeated()
    assert elapsed_hours(earlier, later) == 1.0
    with pytest.raises(w.RepeatedTime):
        wall_clock("2024-11-03T01:30", "America/New_York")

def test_spring_forward_gap_shifts_instant():
    with pytest.raises(w.SkippedTime):
        wall_clock("2024-03-10T02:30", "America/New_York")
    compatible = wall_clock("2024-03-10T02:30", "America/New_York", disambiguation="compatible")
    assert compatible.hour == 3 and compatible.minute == 30
    assert compatible.to_instant() == w.Instant.from_utc(2024, 3, 10, 7, 30)

def test_calendar_day_versus_exact_24_hours():
    start = w.ZonedDateTime(2024, 3, 9, 12, tz="America/New_York")
    calendar = calendar_deadline(start, days=1)
    exact = exact_deadline(start, hours=24)
    assert calendar.hour == 12
    assert exact.to_tz("America/New_York").hour == 13
    assert exact.timestamp() - calendar.to_instant().timestamp() == 3600

def test_month_addition_clamps_to_end_of_month():
    assert wall_clock("2024-01-31T12:00", "UTC").add(months=1).day == 29
    assert wall_clock("2023-01-31T12:00", "UTC").add(months=1).day == 28

def test_calendar_span_differs_from_exact_span():
    start = w.ZonedDateTime(2024, 3, 1, 12, tz="America/New_York")
    end = calendar_deadline(start, months=1)
    assert calendar_months(start, end) == 1
    assert end.since(start, total="days") == 31.0
    assert elapsed_hours(start, end) == 743.0

def test_instant_round_trip_is_zone_agnostic():
    instant = w.Instant.from_utc(2024, 3, 10, 7, 0)
    ny = instant.to_tz("America/New_York")
    utc = instant.to_tz("UTC")
    assert ny.format_iso() != utc.format_iso()
    assert ny == utc and ny.to_instant() == instant
    assert ny.to_instant().to_tz("Asia/Tokyo") == instant
