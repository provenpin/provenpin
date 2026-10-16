import pytest
from lark.exceptions import (
    UnexpectedCharacters,
    UnexpectedInput,
    UnexpectedToken,
    VisitError,
)

from calculator import evaluate, parse

def test_precedence_and_parens():
    assert evaluate("2 + 3 * 4") == 14.0
    assert evaluate("-(2 + 3) * 4") == -20.0

def test_division_is_float():
    assert evaluate("7 / 2") == 3.5

def test_unexpected_token_reports_position_and_expected():
    with pytest.raises(UnexpectedToken) as exc:
        parse("1 + * 2")
    assert exc.value.line == 1 and exc.value.column == 5
    assert "NUMBER" in exc.value.expected

def test_unknown_character_is_not_a_token_error():
    with pytest.raises(UnexpectedCharacters) as exc:
        parse("1 # 2")
    assert (exc.value.line, exc.value.column) == (1, 3)
    assert isinstance(exc.value, UnexpectedInput)

def test_transformer_errors_are_wrapped_in_visit_error():
    with pytest.raises(VisitError) as exc:
        evaluate("1 / 0")
    assert isinstance(exc.value.orig_exc, ZeroDivisionError)
