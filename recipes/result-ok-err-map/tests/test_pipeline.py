import pytest
from result import Err, Ok, Result, UnwrapError

from pipeline import parse_int, run


def test_err_short_circuits_map_and_and_then():
    calls = []
    err: Result[int, str] = Err("boom")
    assert err.map(lambda n: calls.append(n)) == Err("boom")
    assert err.and_then(lambda n: Ok(calls.append(n))) == Err("boom")
    assert calls == []  # neither op ran, so no exception can leak


def test_map_wraps_but_and_then_flattens():
    assert Ok(2).map(lambda n: Ok(n * 2)) == Ok(Ok(4))
    assert Ok(2).and_then(lambda n: Ok(n * 2)) == Ok(4)


def test_pipeline_stops_at_first_error_without_exceptions():
    assert run("4") == Ok(0.25)
    assert run("0") == Err("not positive: 0")
    assert run("-2") == Err("not positive: -2")
    bad = run("abc")
    assert bad.is_err()
    assert bad.err_value.startswith("bad number 'abc':")


def test_or_else_recovers_only_on_err():
    assert Ok(2).or_else(lambda msg: Ok(-1.0)) == Ok(2)
    assert Err("e").or_else(lambda msg: Ok(-1.0)) == Ok(-1.0)
    assert run("nope").or_else(lambda msg: Ok(0.0)) == Ok(0.0)


def test_value_access_is_deprecated():
    with pytest.deprecated_call():
        assert Ok(1).value == 1
    with pytest.deprecated_call():
        assert Err("boom").value == "boom"
    assert Ok(1).ok_value == 1
    assert Err("boom").err_value == "boom"


def test_unwrap_keeps_original_exception_as_cause():
    err = parse_int("nope")
    with pytest.raises(UnwrapError) as info:
        err.unwrap()
    assert isinstance(info.value.__cause__, ValueError)
    with pytest.raises(ValueError):
        err.unwrap_or_raise(ValueError)
