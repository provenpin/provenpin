from datetime import date, datetime, timedelta

import isodate
import pytest
from durations import format_duration, parse_duration, parse_instant, shift
from isodate import Duration


def test_time_only_duration_is_a_timedelta():
    assert parse_duration("PT36H") == timedelta(hours=36)
    assert parse_duration("P2W") == timedelta(weeks=2)
    assert format_duration(timedelta(hours=36)) == "P1DT12H"


def test_month_duration_is_not_a_timedelta():
    one_month = parse_duration("P1M")
    assert isinstance(one_month, Duration)
    assert one_month == Duration(months=1)
    assert one_month != timedelta(days=30)
    assert isinstance(parse_duration("P0D"), timedelta)


def test_month_and_year_arithmetic_clamps_to_month_end():
    assert shift(datetime(2024, 1, 31), "P1M") == datetime(2024, 2, 29)
    assert shift(date(2024, 2, 29), "P1Y") == date(2025, 2, 28)


def test_full_duration_round_trips_and_zero_formats_as_p0d():
    text = "P1Y2M3DT4H5M6S"
    assert format_duration(parse_duration(text)) == text
    assert format_duration(timedelta(0)) == "P0D"


def test_datetime_z_parsing_and_date_only_input():
    assert parse_instant("2024-01-01T00:00:00Z").utcoffset() == timedelta(0)
    assert parse_instant("2024-01-01T00:00:00Z").tzinfo is isodate.UTC
    with pytest.raises(isodate.ISO8601Error):
        parse_instant("2024-01-01")
    assert isodate.parse_date("2024-01-01") == date(2024, 1, 1)


def test_invalid_durations_raise_but_pt_is_silently_zero():
    for bad in ("1Y", "P1H", "P"):
        with pytest.raises(isodate.ISO8601Error):
            parse_duration(bad)
    assert parse_duration("PT") == timedelta(0)
