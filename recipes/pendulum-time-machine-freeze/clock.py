import pendulum
from pendulum import DateTime


def days_until(target: DateTime) -> int:
    """Whole days between now (in target's timezone) and target."""
    return (target - pendulum.now(target.tz)).days


def to_tz(dt: DateTime, tz: str) -> DateTime:
    """The same instant, expressed in another timezone."""
    return dt.in_timezone(tz)


def add_months(anchor: DateTime, months: int = 1) -> DateTime:
    """Add calendar months, clamping to the last valid day."""
    return anchor.add(months=months)
