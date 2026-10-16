from dataclasses import dataclass

from limits import parse
from limits.storage import MemoryStorage
from limits.strategies import FixedWindowRateLimiter, MovingWindowRateLimiter


@dataclass
class Decision:
    allowed: bool
    remaining: int
    reset_at: float


class RateLimiter:
    def __init__(self, rule: str = "3/minute", strategy: str = "moving"):
        self.item = parse(rule)
        self.storage = MemoryStorage()
        if strategy == "moving":
            self.limiter = MovingWindowRateLimiter(self.storage)
        elif strategy == "fixed":
            self.limiter = FixedWindowRateLimiter(self.storage)
        else:
            raise ValueError(f"unknown strategy: {strategy!r}")

    def consume(self, key: str, cost: int = 1) -> Decision:
        allowed = self.limiter.hit(self.item, key, cost=cost)
        stats = self.limiter.get_window_stats(self.item, key)
        return Decision(allowed, stats.remaining, stats.reset_time)

    def reset(self, key: str) -> None:
        self.limiter.clear(self.item, key)
