from __future__ import annotations

from collections.abc import Iterator

import pendulum
from pendulum import DateTime, Interval


def day_range(start: DateTime, end: DateTime) -> Iterator[DateTime]:
    return pendulum.interval(start, end).range("days")


def month_anchors(start: DateTime, end: DateTime) -> Iterator[DateTime]:
    return pendulum.interval(start, end).range("months")


def to_timezone(dt: DateTime, tz: str) -> DateTime:
    return dt.in_timezone(tz)


def span(start: DateTime, end: DateTime) -> Interval:
    return end - start
