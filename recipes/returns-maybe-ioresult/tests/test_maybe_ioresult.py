import pytest
from returns.io import IO, IOFailure, IOSuccess
from returns.maybe import Maybe, Nothing, Some
from returns.result import Failure, Success, UnwrapFailedError

import maybe_ioresult as m


def test_some_none_is_not_nothing_but_maybe_normalizes_none():
    assert Some(None) != Nothing
    assert Maybe.from_optional(None) == Nothing
    assert m.parse_seat("x") == Nothing
    assert m.parse_seat("4") == Some(4)
    assert bool(Nothing) is False
    assert bool(Some(0)) is True


def test_map_nests_but_bind_flattens_on_maybe():
    assert Some(2).map(lambda n: Some(n + 1)) == Some(Some(3))
    assert Some(2).bind(lambda n: Some(n + 1)) == Some(3)
    assert Some(2).map(lambda n: Nothing) == Some(Nothing)
    assert Some(2).bind(lambda n: Nothing) == Nothing


def test_nothing_short_circuits_and_bind_optional_absorbs_none():
    seen = []

    def step(value):
        seen.append(value)
        return Some(value)

    assert Nothing.map(step) == Nothing
    assert Nothing.bind(step) == Nothing
    assert seen == []
    assert Some("4").bind_optional(lambda s: int(s) if s.isdigit() else None) == Some(4)
    assert Some("x").bind_optional(lambda s: int(s) if s.isdigit() else None) == Nothing


def test_impure_safe_captures_exceptions_and_io_boxes_unwrap():
    assert m.reserve(2) == IOSuccess("seat-2")
    failed = m.reserve(3)
    assert isinstance(failed, IOFailure)
    assert failed.failure()._inner_value.args == ("seat 3 taken",)
    assert failed.value_or("none") == IO("none")
    assert failed.value_or("none") != "none"
    with pytest.raises(UnwrapFailedError) as exc:
        failed.unwrap()
    assert isinstance(exc.value.__cause__, ValueError)


def test_bind_result_bridges_result_while_bind_keeps_the_io_rail():
    assert IOSuccess(2).bind_result(lambda n: Success(n + 1)) == IOSuccess(3)
    assert IOSuccess(2).bind_result(lambda n: Failure("no")) == IOFailure("no")
    assert IOSuccess(2).bind(lambda n: Success(n + 1)) == Success(3)


def test_checkout_combines_maybe_and_ioresult():
    assert m.checkout("2") == IOSuccess("seat-2")
    assert m.checkout("x") == IOFailure("invalid seat: x")
    assert m.checkout("99") == IOFailure("invalid seat: 99")
    taken = m.checkout("3")
    assert isinstance(taken, IOFailure)
    assert isinstance(taken.failure()._inner_value, ValueError)
