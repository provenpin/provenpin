import pytest
from intervaltree import Interval, IntervalTree

from bookings import RoomSchedule


def test_point_query_vs_empty_range():
    s = RoomSchedule()
    s.reserve(9, 12, "ana")
    assert s.who_at(10) == ["ana"]
    assert s.clashes(10, 10) == []
    assert s.clashes(10, 11) == [(9, 12, "ana")]


def test_touching_reservations_are_allowed():
    s = RoomSchedule()
    s.reserve(9, 10, "ana")
    s.reserve(10, 11, "bo")
    assert s.clashes(9, 11) == [(9, 10, "ana"), (10, 11, "bo")]


def test_double_booking_raises():
    s = RoomSchedule()
    s.reserve(9, 11, "ana")
    with pytest.raises(ValueError, match="double booked with ana"):
        s.reserve(10, 12, "bo")


def test_merge_overlaps_default_is_strict():
    adjacent = IntervalTree([Interval(9, 10, "a"), Interval(10, 11, "b")])
    adjacent.merge_overlaps()
    assert sorted(adjacent) == [Interval(9, 10, "a"), Interval(10, 11, "b")]
    adjacent.merge_overlaps(strict=False)
    assert sorted(adjacent) == [Interval(9, 11)]


def test_busy_blocks_join_back_to_back():
    s = RoomSchedule()
    s.reserve(9, 10, "ana")
    s.reserve(10, 11, "bo")
    s.reserve(12, 13, "cy")
    assert s.busy_blocks() == [(9, 11), (12, 13)]


def test_chop_then_slice():
    s = RoomSchedule()
    s.reserve(9, 17, "ana")
    s.block_out(12, 13)
    assert s.clashes(9, 17) == [(9, 12, "ana"), (13, 17, "ana")]
    s.split_at(15)
    assert s.clashes(9, 17) == [(9, 12, "ana"), (13, 15, "ana"), (15, 17, "ana")]
