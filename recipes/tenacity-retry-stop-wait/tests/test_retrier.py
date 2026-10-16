import pytest
from tenacity import (
    RetryError,
    Retrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from retrier import (
    FatalError,
    TransientError,
    build_retryer,
    reload_config,
    run_with_retry,
)


def test_retries_transient_then_succeeds():
    calls = []

    def flaky():
        calls.append(1)
        if len(calls) < 3:
            raise TransientError("warming up")
        return "ready"

    assert run_with_retry(flaky) == "ready"
    assert len(calls) == 3


def test_exhaustion_reraises_original_and_stops():
    calls = []

    def always_down():
        calls.append(1)
        raise TransientError("down")

    with pytest.raises(TransientError):
        run_with_retry(always_down, max_attempts=2)
    assert len(calls) == 2


def test_non_retryable_error_is_not_retried():
    calls = []

    def bad_request():
        calls.append(1)
        raise FatalError("400")

    with pytest.raises(FatalError):
        run_with_retry(bad_request)
    assert len(calls) == 1


def test_without_reraise_raises_retryerror():
    retryer = build_retryer(max_attempts=2, reraise=False)

    def always_down():
        raise TransientError("down")

    with pytest.raises(RetryError) as excinfo:
        retryer(always_down)
    assert isinstance(excinfo.value.last_attempt.exception(), TransientError)


def test_wait_exponential_sleeps_between_attempts_only():
    sleeps = []
    retryer = Retrying(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(TransientError),
        reraise=True,
    )
    retryer.sleep = sleeps.append

    def always_down():
        raise TransientError("x")

    with pytest.raises(TransientError):
        retryer(always_down)
    assert sleeps == [1, 2]


def test_decorator_reraise_keeps_original_exception():
    calls = []

    def loader():
        calls.append(1)
        if len(calls) < 2:
            raise TransientError("retry")
        return {"ok": True}

    assert reload_config(loader) == {"ok": True}
    assert len(calls) == 2
