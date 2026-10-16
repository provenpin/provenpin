import pytest
from pybreaker import CircuitBreaker, CircuitBreakerError

from breaker import ChargeService, FakeGateway, GatewayDown, InvalidCharge, StateLog


def make_service(gateway, **kwargs):
    log = StateLog()
    breaker = CircuitBreaker(listeners=[log], name="payments", **kwargs)
    return ChargeService(gateway, breaker), log


@pytest.fixture
def gateway():
    return FakeGateway()


def test_trip_raises_breaker_error_not_original(gateway):
    svc, log = make_service(gateway, fail_max=2, reset_timeout=60)
    gateway.up = False
    with pytest.raises(GatewayDown):
        svc.charge(10)
    with pytest.raises(CircuitBreakerError) as exc:
        svc.charge(10)
    assert "opened" in str(exc.value)
    assert svc.breaker.current_state == "open"
    assert log.transitions == ["closed->open"]


def test_open_short_circuits_without_calling_backend(gateway):
    svc, _ = make_service(gateway, fail_max=1, reset_timeout=60)
    gateway.up = False
    with pytest.raises(CircuitBreakerError):
        svc.charge(10)
    assert gateway.calls == 1
    with pytest.raises(CircuitBreakerError):
        svc.charge(10)
    assert gateway.calls == 1
    assert svc.breaker.current_state == "open"


def test_elapsed_timeout_half_opens_then_closes(gateway):
    svc, log = make_service(gateway, fail_max=1, reset_timeout=0)
    gateway.up = False
    with pytest.raises(CircuitBreakerError):
        svc.charge(10)
    gateway.up = True
    assert svc.charge(10) == "charged:10"
    assert svc.breaker.current_state == "closed"
    assert log.transitions == ["closed->open", "open->half-open", "half-open->closed"]


def test_failed_trial_reopens(gateway):
    svc, log = make_service(gateway, fail_max=1, reset_timeout=0)
    gateway.up = False
    with pytest.raises(CircuitBreakerError):
        svc.charge(10)
    with pytest.raises(CircuitBreakerError):
        svc.charge(10)
    assert svc.breaker.current_state == "open"
    assert log.transitions == ["closed->open", "open->half-open", "half-open->open"]


def test_half_open_needs_success_threshold(gateway):
    svc, _ = make_service(gateway, fail_max=1, reset_timeout=0, success_threshold=2)
    gateway.up = False
    with pytest.raises(CircuitBreakerError):
        svc.charge(10)
    gateway.up = True
    svc.charge(10)
    assert svc.breaker.current_state == "half-open"
    svc.charge(10)
    assert svc.breaker.current_state == "closed"


def test_excluded_exception_never_trips(gateway):
    svc, _ = make_service(gateway, fail_max=1, reset_timeout=60, exclude=[InvalidCharge])
    for _ in range(3):
        with pytest.raises(InvalidCharge):
            svc.charge(0)
    assert svc.breaker.current_state == "closed"
    assert svc.breaker.fail_counter == 0
