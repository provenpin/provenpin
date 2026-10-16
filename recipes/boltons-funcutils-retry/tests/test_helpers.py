import inspect

import pytest

from helpers import RetryError, Rollup, Slotted, retry


def test_retry_retries_until_success():
    calls = []

    @retry(attempts=3)
    def flaky():
        calls.append(1)
        if len(calls) < 3:
            raise OSError("transient")
        return "ok"

    assert flaky() == "ok"
    assert len(calls) == 3


def test_retry_exhausts_and_chains_cause():
    @retry(attempts=2)
    def always_fails():
        raise OSError("down")

    with pytest.raises(RetryError) as excinfo:
        always_fails()
    assert isinstance(excinfo.value.__cause__, OSError)


def test_retry_preserves_signature_via_wraps():
    @retry(attempts=1)
    def add(x, y=0):
        return x + y

    assert str(inspect.signature(add)) == "(x, y=0)"


def test_cachedproperty_caches_and_delattr_invalidates():
    r = Rollup([1, 2, 3])

    assert r.total == 6
    assert r.total == 6
    assert r.calls["total"] == 1

    del r.total
    assert r.total == 6
    assert r.calls["total"] == 2


def test_cachedproperty_needs_instance_dict():
    s = Slotted(4)
    with pytest.raises(AttributeError):
        _ = s.doubled


def test_cachedmethod_is_per_instance_and_needs_hashable_args():
    a, b = Rollup([10, 10]), Rollup([10, 10])

    assert a.bucket(4) == 5
    assert a.bucket(4) == 5
    assert a.calls["bucket"] == 1
    assert b.calls["bucket"] == 0

    b.bucket(4)
    assert b.calls["bucket"] == 1
    assert len(a._buckets) == 1 and len(b._buckets) == 1

    with pytest.raises(TypeError):
        a.bucket([4])
