import time

import arrow
import pytest
import time_machine

from scheduling import daily_checkpoint, last_seen, monthly_renewal


@time_machine.travel("2024-05-01T12:00:00+00:00", tick=False)
def test_utcnow_tracks_the_frozen_clock():
    assert arrow.utcnow() == arrow.get("2024-05-01T12:00:00+00:00")
    assert arrow.utcnow() == arrow.utcnow()
    assert arrow.utcnow().int_timestamp == 1714564800


def test_default_tick_advances_unless_disabled():
    with time_machine.travel("2024-05-01T12:00:00+00:00"):
        first = arrow.utcnow()
        time.sleep(0.02)
        assert arrow.utcnow() > first

    with time_machine.travel("2024-05-01T12:00:00+00:00", tick=False):
        first = arrow.utcnow()
        time.sleep(0.02)
        assert arrow.utcnow() == first


@time_machine.travel("2024-05-01T12:00:00+00:00", tick=False)
def test_humanize_is_deterministic_under_a_frozen_clock():
    assert last_seen(arrow.get("2024-05-01T09:00:00+00:00")) == "3 hours ago"
    assert last_seen(arrow.get("2024-05-01T15:00:00+00:00")) == "in 3 hours"


def test_humanize_truncates_toward_zero():
    now = arrow.get("2024-05-01T12:00:00+00:00")
    assert last_seen(now.shift(minutes=-119), now) == "an hour ago"
    assert last_seen(now.shift(minutes=-120), now) == "2 hours ago"
    assert last_seen(now.shift(hours=-47), now) == "a day ago"
    assert last_seen(now.shift(hours=-48), now) == "2 days ago"


def test_shift_clamps_but_replace_raises():
    jan31 = arrow.get("2024-01-31T00:00:00+00:00")
    assert monthly_renewal(jan31).format("YYYY-MM-DD") == "2024-02-29"
    leap = arrow.get("2024-02-29T00:00:00+00:00")
    assert leap.shift(years=1).format("YYYY-MM-DD") == "2025-02-28"
    with pytest.raises(ValueError):
        leap.replace(year=2025)


def test_day_shift_preserves_wall_clock_across_dst():
    with time_machine.travel("2024-03-09T17:00:00+00:00", tick=False):
        start = arrow.now("US/Eastern")
        assert start.format("YYYY-MM-DD HH:mm ZZ") == "2024-03-09 12:00 -05:00"

    same_clock = daily_checkpoint(start)
    assert same_clock.format("HH:mm ZZ") == "12:00 -04:00"
    assert same_clock.timestamp() - start.timestamp() == 23 * 3600
    assert start.shift(hours=24).timestamp() == same_clock.timestamp()
