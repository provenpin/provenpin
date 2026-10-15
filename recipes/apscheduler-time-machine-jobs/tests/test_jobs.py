import time
from datetime import datetime, UTC
from zoneinfo import ZoneInfo

import time_machine

from jobs import heartbeat_trigger, next_report, report_trigger, upcoming

NY = ZoneInfo("America/New_York")

def test_report_keeps_local_wall_clock_across_dst():
    # US DST starts 2024-03-10: 09:00 stays 09:00 local, but UTC shifts from 14:00 to 13:00.
    with time_machine.travel(datetime(2024, 3, 9, 12, tzinfo=UTC), tick=False):
        fires = upcoming(report_trigger(), datetime.now(UTC), 2)
    assert [f.astimezone(NY).hour for f in fires] == [9, 9]
    assert [f.astimezone(UTC).hour for f in fires] == [14, 13]

def test_next_report_reads_frozen_clock():
    with time_machine.travel(datetime(2024, 7, 1, 13, 30, tzinfo=UTC), tick=False):
        assert next_report() == datetime(2024, 7, 2, 9, 0, tzinfo=NY)

def test_interval_stays_on_start_grid():
    start = datetime(2024, 1, 1, 8, tzinfo=UTC)
    fires = upcoming(heartbeat_trigger(start), datetime(2024, 1, 1, 8, 37, tzinfo=UTC), 2)
    assert fires == [datetime(2024, 1, 1, 8, 45, tzinfo=UTC), datetime(2024, 1, 1, 9, 0, tzinfo=UTC)]

def test_default_start_is_captured_at_construction():
    # The default start_date is now + interval, so build the trigger inside travel.
    with time_machine.travel(datetime(2024, 1, 1, 8, tzinfo=UTC), tick=False):
        trig = heartbeat_trigger()
    first = trig.get_next_fire_time(None, datetime(2024, 1, 1, 9, 5, tzinfo=UTC))
    assert first == datetime(2024, 1, 1, 9, 15, tzinfo=UTC)

def test_tick_false_freezes_clock():
    t = datetime(2024, 1, 1, tzinfo=UTC)
    with time_machine.travel(t, tick=False):
        before = time.time()
        time.sleep(0.01)
        assert time.time() == before == t.timestamp()
