from datetime import datetime
from itertools import islice

from croniter import croniter

def next_runs(expr: str, start: datetime, count: int = 1, day_or: bool = True) -> list[datetime]:
    it = croniter(expr, start, day_or=day_or)
    return [it.get_next(datetime) for _ in range(count)]

def prev_runs(expr: str, start: datetime, count: int = 1) -> list[datetime]:
    it = croniter(expr, start)
    return [it.get_prev(datetime) for _ in range(count)]

def upcoming(expr: str, start: datetime, count: int) -> list[datetime]:
    # all_next() is an infinite generator: always bound it with islice.
    it = croniter(expr, start)
    return list(islice(it.all_next(datetime), count))

def is_valid(expr: str) -> bool:
    return croniter.is_valid(expr)
