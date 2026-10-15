import pytest
from sortedcontainers import SortedDict

from timeline import EventTimeline


def test_arrival_order_does_not_matter():
    tl = EventTimeline()
    for ts, name in [(30, "c"), (10, "a"), (20, "b")]:
        tl.add(ts, name)
    assert tl.window(0, 100) == ["a", "b", "c"]
    assert tl.span() == (10, 30)


def test_same_timestamp_keeps_arrival_order():
    tl = EventTimeline()
    tl.add(100, "open")
    tl.add(100, "close")
    assert tl.window(100, 100) == ["open", "close"]
    assert len(tl) == 2


def test_window_bounds_follow_tuple_inclusive():
    tl = EventTimeline()
    for ts in (10, 20, 30):
        tl.add(ts, str(ts))
    assert tl.window(10, 30) == ["10", "20", "30"]
    assert tl.window(10, 30, inclusive=(True, False)) == ["10", "20"]
    assert tl.window(10, 30, inclusive=(False, True)) == ["20", "30"]
    assert tl.window(40, 99) == []


def test_irange_requires_tuple_not_bool():
    # A bool looks natural but irange() subscripts inclusive[0] and blows up.
    with pytest.raises(TypeError):
        list(SortedDict({1: "a"}).irange(0, 5, inclusive=False))


def test_latest_returns_chronological_tail():
    tl = EventTimeline()
    for ts, name in [(10, "a"), (10, "b"), (20, "c"), (30, "d")]:
        tl.add(ts, name)
    assert tl.latest(2) == [(20, "c"), (30, "d")]
    assert tl.latest(0) == []


def test_prune_before_is_exclusive_and_empties():
    tl = EventTimeline()
    for ts in (10, 20, 30):
        tl.add(ts, str(ts))
    assert tl.prune_before(30) == 2
    assert tl.window(0, 100) == ["30"]
    assert tl.prune_before(99) == 1
    assert tl.span() is None
