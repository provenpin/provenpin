import pytest
from click.testing import CliRunner
from freezegun import freeze_time

from scheduler import main, next_runs

NINE_AM = "FREQ=DAILY;BYHOUR=9;BYMINUTE=0"


def test_daily_nine_am_keeps_wall_clock_across_dst():
    # 2024-03-09 12:00Z is 07:00 EST; US DST starts 2024-03-10.
    with freeze_time("2024-03-09T12:00:00Z"):
        runs = next_runs(NINE_AM, "America/New_York", count=2)
    assert [r.isoformat() for r in runs] == [
        "2024-03-09T09:00:00-05:00",
        "2024-03-10T09:00:00-04:00",
    ]


def test_nonexistent_time_in_dst_gap_is_normalized():
    # 02:30 does not exist on 2024-03-10 in New York; it resolves to 03:30 EDT.
    with freeze_time("2024-03-09T12:00:00Z"):
        runs = next_runs("FREQ=DAILY;BYHOUR=2;BYMINUTE=30", "America/New_York", count=2)
    assert [r.isoformat() for r in runs] == [
        "2024-03-10T03:30:00-04:00",
        "2024-03-11T02:30:00-04:00",
    ]


def test_ambiguous_time_in_fall_back_uses_first_occurrence():
    # 01:30 happens twice on 2024-11-03 in New York; fold=0 picks the EDT (first) one.
    with freeze_time("2024-11-02T12:00:00Z"):
        runs = next_runs("FREQ=DAILY;BYHOUR=1;BYMINUTE=30", "America/New_York", count=2)
    assert [r.isoformat() for r in runs] == [
        "2024-11-03T01:30:00-04:00",
        "2024-11-04T01:30:00-05:00",
    ]


def test_cli_prints_runs_in_requested_zone():
    runner = CliRunner()
    with freeze_time("2024-03-09T12:00:00Z"):
        result = runner.invoke(main, [NINE_AM, "--tz", "Europe/Berlin", "-n", "2"])
    assert result.exit_code == 0, result.output
    assert result.output.splitlines() == [
        "2024-03-10T09:00:00+01:00",
        "2024-03-11T09:00:00+01:00",
    ]


@pytest.mark.parametrize(
    "args, message",
    [
        ([NINE_AM, "--tz", "Europe/Atlantis"], "No time zone found"),
        (["FREQ=NOPE", "--tz", "UTC"], "FREQ"),
    ],
)
def test_bad_input_is_a_usage_error(args, message):
    runner = CliRunner()
    with freeze_time("2024-03-09T12:00:00Z"):
        result = runner.invoke(main, args)
    assert result.exit_code == 2
    assert message in result.output
