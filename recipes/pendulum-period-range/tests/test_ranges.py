import pendulum
import pytest
from ranges import day_range, month_anchors, span, to_timezone


def test_day_range_stops_before_the_end():
    start = pendulum.datetime(2024, 1, 1, 10, 30, tz="UTC")
    end = pendulum.datetime(2024, 1, 3, 9, 0, tz="UTC")
    assert [d.to_date_string() for d in day_range(start, end)] == [
        "2024-01-01",
        "2024-01-02",
    ]


def test_month_anchors_keep_the_start_day():
    start = pendulum.datetime(2024, 1, 15, tz="UTC")
    end = pendulum.datetime(2024, 4, 1, tz="UTC")
    assert [d.to_date_string() for d in month_anchors(start, end)] == [
        "2024-01-15",
        "2024-02-15",
        "2024-03-15",
    ]


def test_conversion_keeps_the_instant():
    moment = pendulum.datetime(2024, 3, 9, 12, tz="UTC")
    tokyo = to_timezone(moment, "Asia/Tokyo")
    assert tokyo == moment
    assert (tokyo.timezone_name, tokyo.hour) == ("Asia/Tokyo", 21)


def test_day_range_across_dst_keeps_local_midnight():
    start = pendulum.datetime(2024, 3, 9, tz="America/New_York")
    end = pendulum.datetime(2024, 3, 11, tz="America/New_York")
    days = list(day_range(start, end))
    assert [d.hour for d in days] == [0, 0, 0]
    assert [d.in_timezone("UTC").hour for d in days] == [5, 5, 4]


def test_subtracting_datetimes_returns_an_interval():
    start = pendulum.datetime(2024, 3, 9, tz="America/New_York")
    end = pendulum.datetime(2024, 3, 11, tz="America/New_York")
    diff = span(start, end)
    assert isinstance(diff, pendulum.Interval)
    assert diff.in_days() == 2
    assert diff.total_days() == pytest.approx(47 / 24)


def test_inverted_range_iterates_backwards():
    interval = pendulum.interval(
        pendulum.datetime(2024, 1, 5, tz="UTC"),
        pendulum.datetime(2024, 1, 1, tz="UTC"),
    )
    assert interval.invert is True
    assert [d.to_date_string() for d in interval.range("days")] == [
        "2024-01-05",
        "2024-01-04",
        "2024-01-03",
        "2024-01-02",
        "2024-01-01",
    ]
