from __future__ import annotations

from sortedcontainers import SortedDict

# Boundary spec for SortedDict.irange: (include_min, include_max).
Inclusive = tuple[bool, bool]


class EventTimeline:
    """In-memory event log keyed by integer timestamp (e.g. milliseconds).

    A SortedDict keeps keys ordered no matter the arrival order, so locating a
    window costs O(log n) and multiple events can share one timestamp by
    mapping it to a list.
    """

    def __init__(self) -> None:
        self._events: SortedDict[int, list[str]] = SortedDict()

    def add(self, ts: int, name: str) -> None:
        self._events.setdefault(ts, []).append(name)

    def __len__(self) -> int:
        return sum(len(names) for names in self._events.values())

    def window(self, start: int, end: int, *, inclusive: Inclusive = (True, True)) -> list[str]:
        keys = self._events.irange(start, end, inclusive=inclusive)
        return [name for ts in keys for name in self._events[ts]]

    def latest(self, n: int) -> list[tuple[int, str]]:
        pairs: list[tuple[int, str]] = []
        for ts in reversed(self._events.keys()):
            pairs.extend((ts, name) for name in reversed(self._events[ts]))
            if len(pairs) >= n:
                break
        return list(reversed(pairs))[-n:] if n > 0 else []

    def span(self) -> tuple[int, int] | None:
        if not self._events:
            return None
        return self._events.peekitem(0)[0], self._events.peekitem(-1)[0]

    def prune_before(self, ts: int) -> int:
        stale = list(self._events.irange(maximum=ts, inclusive=(True, False)))
        for key in stale:
            del self._events[key]
        return len(stale)
