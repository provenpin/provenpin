from __future__ import annotations

import datetime

import pendulum
from croniter import croniter


def next_run(cron: str, after: pendulum.DateTime) -> pendulum.DateTime:
    """Next cron match strictly after `after`, as a tz-aware pendulum DateTime.

    croniter keeps `after.tzinfo` (so DST is handled) but always hands back a
    plain `datetime.datetime`; asking for `ret_type=pendulum.DateTime` does not
    change that, so we re-wrap it with `pendulum.instance`.
    """
    nxt = croniter(cron, after).get_next(datetime.datetime)
    return pendulum.instance(nxt)


def upcoming(
    cron: str, after: pendulum.DateTime, count: int
) -> list[pendulum.DateTime]:
    """The next `count` cron matches after `after`, in the same timezone."""
    it = croniter(cron, after)
    return [pendulum.instance(it.get_next(datetime.datetime)) for _ in range(count)]
