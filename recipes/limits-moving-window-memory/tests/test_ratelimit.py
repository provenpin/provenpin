import time

import pytest

from ratelimit import RateLimiter


class Clock:
    def __init__(self, start: float = 1_700_000_000.0):
        self.now = start

    def __call__(self) -> float:
        return self.now

    def tick(self, seconds: float) -> None:
        self.now += seconds


@pytest.fixture
def clock(monkeypatch):
    c = Clock()
    # limits.storage.memory reads time.time() directly, so swapping the module
    # attribute is enough to make both versions of the window deterministic.
    monkeypatch.setattr(time, "time", c)
    return c


def test_moving_window_caps_at_limit_and_test_does_not_consume():
    rl = RateLimiter("3/minute")
    assert [rl.consume("ip").allowed for _ in range(3)] == [True, True, True]
    last = rl.consume("ip")
    assert last.allowed is False and last.remaining == 0
    assert rl.limiter.test(rl.item, "ip") is False
    assert rl.consume("other-ip").allowed is True


def test_moving_window_frees_capacity_as_it_slides(clock):
    rl = RateLimiter("2/second")
    assert rl.consume("ip").allowed and rl.consume("ip").allowed
    assert rl.consume("ip").allowed is False
    clock.tick(1.1)
    assert rl.consume("ip").allowed is True


def _burst_timeline(strategy, monkeypatch):
    clock = Clock()
    monkeypatch.setattr(time, "time", clock)
    rl = RateLimiter("3/minute", strategy=strategy)
    allowed = [rl.consume("ip").allowed]
    clock.tick(59.9)
    allowed += [rl.consume("ip").allowed for _ in range(2)]
    clock.tick(0.2)
    allowed += [rl.consume("ip").allowed for _ in range(3)]
    return allowed


def test_fixed_window_bursts_at_the_boundary_while_moving_does_not(monkeypatch):
    assert _burst_timeline("fixed", monkeypatch) == [True] * 6
    assert _burst_timeline("moving", monkeypatch) == [True, True, True, True, False, False]


def test_cost_is_all_or_nothing():
    rl = RateLimiter("5/minute")
    assert rl.consume("ip", cost=4).allowed is True
    assert rl.consume("ip", cost=2).allowed is False
    assert rl.consume("ip").allowed is True
    assert rl.consume("ip", cost=99).allowed is False


def test_memory_storage_is_per_instance_and_resettable():
    a = RateLimiter("1/minute")
    b = RateLimiter("1/minute")
    assert a.consume("ip").allowed is True
    assert a.consume("ip").allowed is False
    assert b.consume("ip").allowed is True
    a.reset("ip")
    assert a.consume("ip").allowed is True
