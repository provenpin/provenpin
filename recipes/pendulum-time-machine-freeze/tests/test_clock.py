import datetime as dt
import time

import pendulum
import time_machine

from clock import add_months, days_until, to_tz


def test_freeze_pins_pendulum_now():
    frozen = pendulum.datetime(2024, 1, 15, 12, 0, tz="UTC")
    with time_machine.travel(frozen, tick=False):
        assert pendulum.now("UTC") == frozen
        assert days_until(frozen.add(days=10)) == 10
        assert days_until(frozen) == 0


def test_naive_input_kind_changes_meaning():
    naive = dt.datetime(2024, 1, 15, 12, 0)
    with time_machine.travel(naive, tick=False):
        assert dt.datetime.now(dt.timezone.utc).replace(tzinfo=None) == naive
    with time_machine.travel("2024-01-15 12:00:00", tick=False):
        assert pendulum.now().naive() == naive


def test_tick_flag_controls_flow():
    with time_machine.travel("2024-01-15 12:00:00", tick=False):
        assert pendulum.now("UTC") == pendulum.now("UTC")
    with time_machine.travel("2024-01-15 12:00:00", tick=True):
        first = pendulum.now("UTC")
        time.sleep(0.01)
        assert pendulum.now("UTC") > first


def test_add_days_keeps_wall_clock_across_dst():
    frozen = pendulum.datetime(2021, 3, 13, 12, 0, tz="America/New_York")
    with time_machine.travel(frozen, tick=False):
        now = pendulum.now("America/New_York")
        assert now.add(days=1).hour == 12
        assert now.add(days=1).offset_hours == -4.0
        assert now.add(hours=24).hour == 13


def test_add_months_clamps_to_month_end():
    with time_machine.travel(pendulum.datetime(2024, 1, 31, tz="UTC"), tick=False):
        assert add_months(pendulum.now("UTC")) == pendulum.datetime(2024, 2, 29, tz="UTC")
        assert add_months(pendulum.now("UTC"), -1) == pendulum.datetime(2023, 12, 31, tz="UTC")


def test_in_timezone_keeps_instant():
    frozen = pendulum.datetime(2021, 8, 1, 12, 0, tz="Europe/Paris")
    with time_machine.travel(frozen, tick=False):
        now = pendulum.now("Europe/Paris")
        ny = to_tz(now, "America/New_York")
        assert ny.hour == 6
        assert ny == now
        assert ny.timestamp() == now.timestamp()
