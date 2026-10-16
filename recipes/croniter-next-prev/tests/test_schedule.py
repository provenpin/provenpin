from datetime import datetime, timezone

import pytest
from croniter import CroniterBadCronError, croniter

from schedule import is_valid, next_runs, prev_runs, upcoming

def test_next_is_strictly_after_matching_start():
    start = datetime(2024, 1, 1, 0, 0)
    # start already matches the cron, so the next hit is the following day
    assert next_runs("0 0 * * *", start)[0] == datetime(2024, 1, 2)
    assert upcoming("0 0 * * *", start, 3) == [
        datetime(2024, 1, 2),
        datetime(2024, 1, 3),
        datetime(2024, 1, 4),
    ]

def test_prev_walks_backwards():
    start = datetime(2024, 1, 1, 0, 0)
    assert prev_runs("0 0 * * *", start, 2) == [
        datetime(2023, 12, 31),
        datetime(2023, 12, 30),
    ]

def test_default_ret_type_is_epoch_seconds():
    start = datetime(2024, 1, 1, tzinfo=timezone.utc)
    ts = croniter("0 0 * * *", start).get_next()
    assert isinstance(ts, float)
    assert datetime.fromtimestamp(ts, tz=timezone.utc) == datetime(2024, 1, 2, tzinfo=timezone.utc)

def test_day_of_week_seven_equals_sunday():
    start = datetime(2024, 1, 2)
    assert next_runs("0 0 * * 0", start)[0] == next_runs("0 0 * * 7", start)[0] == datetime(2024, 1, 7)

def test_day_or_toggles_or_and_semantics():
    start = datetime(2024, 1, 2)
    # default day_or=True: day-of-month OR day-of-week -> next Monday
    assert next_runs("0 0 1 * 1", start)[0] == datetime(2024, 1, 8)
    # day_or=False: day-of-month AND day-of-week -> first 1st that is a Monday
    assert next_runs("0 0 1 * 1", start, day_or=False)[0] == datetime(2024, 4, 1)

def test_invalid_expression():
    assert is_valid("0 0 * * *") is True
    assert is_valid("61 0 * * *") is False
    with pytest.raises(CroniterBadCronError):
        croniter("61 0 * * *", datetime(2024, 1, 1))
