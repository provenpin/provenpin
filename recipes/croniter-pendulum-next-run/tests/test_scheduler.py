import datetime

import pendulum
from croniter import croniter

from scheduler import next_run, upcoming

NY = "America/New_York"


def test_next_run_returns_tz_aware_pendulum_datetime():
    start = pendulum.datetime(2024, 1, 1, 8, 0, tz=NY)
    # croniter ignores non-datetime ret_type classes and returns a plain datetime
    raw = croniter("0 9 * * *", start).get_next(pendulum.DateTime)
    assert type(raw) is datetime.datetime and not isinstance(raw, pendulum.DateTime)

    result = next_run("0 9 * * *", start)
    assert isinstance(result, pendulum.DateTime)
    assert result.timezone_name == NY
    assert result == pendulum.datetime(2024, 1, 1, 9, 0, tz=NY)


def test_start_time_is_exclusive():
    start = pendulum.datetime(2024, 1, 1, 9, 0, tz=NY)
    assert next_run("0 9 * * *", start) == pendulum.datetime(2024, 1, 2, 9, 0, tz=NY)


def test_spring_forward_skips_missing_local_hour():
    start = pendulum.datetime(2024, 3, 9, 12, 0, tz=NY)
    result = next_run("0 2 * * *", start)
    assert result == pendulum.datetime(2024, 3, 10, 3, 0, tz=NY)
    assert result.tzname() == "EDT"


def test_fall_back_yields_both_folds():
    start = pendulum.datetime(2024, 11, 2, 12, 0, tz=NY)
    runs = upcoming("30 1 * * *", start, 2)
    assert [r.tzname() for r in runs] == ["EDT", "EST"]
    assert [r.fold for r in runs] == [0, 1]
    assert runs[0].timestamp() != runs[1].timestamp()


def test_weekday_cron_skips_the_weekend():
    friday = pendulum.datetime(2024, 1, 5, 10, 0, tz=NY)
    assert next_run("0 9 * * 1-5", friday) == pendulum.datetime(2024, 1, 8, 9, 0, tz=NY)


def test_cron_is_evaluated_in_the_base_timezone():
    start = pendulum.datetime(2024, 1, 1, 0, 0, tz="UTC")
    tokyo = next_run("0 9 * * *", start).in_timezone("Asia/Tokyo")
    assert tokyo.timezone_name == "Asia/Tokyo"
    assert (tokyo.hour, tokyo.minute) == (18, 0)
