from datetime import datetime, timedelta, timezone

import pytest
import time_machine

from schedule import NY, daily_at, next_run, to_utc

START = datetime(2024, 3, 1, tzinfo=NY)

@time_machine.travel(datetime(2024, 3, 9, 17, tzinfo=timezone.utc), tick=False)
def test_wall_clock_preserved_across_spring_forward():
    # 09:00 stays 09:00 local; only the UTC offset changes (EST -5 to EDT -4)
    nxt = next_run(daily_at(START, 9, 0), datetime.now(NY))
    assert nxt.hour == 9
    assert nxt.utcoffset() == timedelta(hours=-4)

def test_nonexistent_local_time_uses_pre_gap_offset():
    # 02:30 does not exist on 2024-03-10; zoneinfo (fold=0) uses the offset before the gap,
    # so 02:30 EST = 07:30 UTC
    nxt = next_run(daily_at(START, 2, 30), datetime(2024, 3, 9, 12, tzinfo=NY))
    assert nxt.hour == 2
    assert to_utc(nxt) == datetime(2024, 3, 10, 7, 30, tzinfo=timezone.utc)

def test_ambiguous_time_fires_once_per_day():
    # 01:30 happens twice on 2024-11-03; rrule yields one occurrence per day, fold=0 (EDT)
    runs = daily_at(START, 1, 30).between(datetime(2024, 11, 2, tzinfo=NY), datetime(2024, 11, 4, tzinfo=NY))
    assert len(runs) == 2
    assert runs[1].utcoffset() == timedelta(hours=-4)

def test_naive_dtstart_is_rejected():
    rule = daily_at(datetime(2024, 3, 1), 9, 0)
    with pytest.raises(TypeError):
        next_run(rule, datetime(2024, 3, 9, tzinfo=NY))
