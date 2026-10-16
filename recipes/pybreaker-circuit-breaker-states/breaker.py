from __future__ import annotations

from pybreaker import CircuitBreaker, CircuitBreakerListener


class GatewayDown(Exception):
    """Backend failure: counts against the breaker."""


class InvalidCharge(Exception):
    """Business error: must never trip the breaker."""


class FakeGateway:
    """In-memory stand-in for a flaky payment gateway (no network)."""

    def __init__(self) -> None:
        self.up = True
        self.calls = 0

    def charge(self, amount: int) -> str:
        self.calls += 1
        if amount <= 0:
            raise InvalidCharge("amount must be positive")
        if not self.up:
            raise GatewayDown(f"gateway unavailable for {amount}")
        return f"charged:{amount}"


class StateLog(CircuitBreakerListener):
    """Records every transition as "old->new" so tests can assert on them."""

    def __init__(self) -> None:
        self.transitions: list[str] = []

    def state_change(self, cb, old_state, new_state) -> None:
        old = old_state.name if old_state is not None else "none"
        self.transitions.append(f"{old}->{new_state.name}")


class ChargeService:
    """Charges through a breaker so a sick gateway cannot keep taking traffic."""

    def __init__(self, gateway: FakeGateway, breaker: CircuitBreaker) -> None:
        self.gateway = gateway
        self.breaker = breaker

    def charge(self, amount: int) -> str:
        return self.breaker.call(self.gateway.charge, amount)
