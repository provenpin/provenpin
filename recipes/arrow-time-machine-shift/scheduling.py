import arrow


def monthly_renewal(start: arrow.Arrow, months: int = 1) -> arrow.Arrow:
    """Advance a renewal date by calendar months, clamping to month end."""
    return start.shift(months=months)


def daily_checkpoint(start: arrow.Arrow, days: int = 1) -> arrow.Arrow:
    """Shift by calendar days; the wall clock is preserved across DST."""
    return start.shift(days=days)


def last_seen(ts: arrow.Arrow, now: arrow.Arrow | None = None) -> str:
    """Humanize a timestamp, optionally against an explicit reference clock."""
    return ts.humanize(now)
