"""DST-aware scheduling helpers built on whenever 0.11."""
import whenever as w

def wall_clock(text: str, tz: str, disambiguation: str = "raise") -> w.ZonedDateTime:
    """Resolve a local wall-clock time, refusing to guess in DST gaps/folds."""
    return w.ZonedDateTime.parse_iso(f"{text}[{tz}]", disambiguation=disambiguation)

def exact_deadline(start: w.ZonedDateTime, *, hours: int = 0, minutes: int = 0) -> w.Instant:
    """A fixed amount of elapsed time later, immune to DST."""
    return start.add(hours=hours, minutes=minutes).to_instant()

def calendar_deadline(start: w.ZonedDateTime, *, days: int = 0, months: int = 0) -> w.ZonedDateTime:
    """The same wall-clock time later, so DST shifts the underlying instant."""
    return start.add(days=days, months=months, disambiguation="compatible")

def elapsed_hours(a: w.ZonedDateTime, b: w.ZonedDateTime) -> float:
    return (b.to_instant() - a.to_instant()).total("hours")

def calendar_months(a: w.ZonedDateTime, b: w.ZonedDateTime) -> int:
    return int(b.since(a, total="months"))
