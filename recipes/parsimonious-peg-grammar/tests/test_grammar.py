import pytest
from parsimonious.exceptions import (IncompleteParseError, ParseError,
                                     VisitationError)

from grammar import evaluate


def test_evaluates_precedence_and_parens():
    assert evaluate("2+3*4") == 14
    assert evaluate("(2+3)*4") == 20
    assert evaluate("7/2") == 3.5


def test_subtraction_is_left_associative():
    assert evaluate("10-3-2") == 5


def test_trailing_input_raises_incomplete_parse_error():
    assert issubclass(IncompleteParseError, ParseError)
    with pytest.raises(IncompleteParseError):
        evaluate("1+2)")


def test_leading_garbage_raises_plain_parse_error():
    with pytest.raises(ParseError) as exc:
        evaluate("+1")
    assert not isinstance(exc.value, IncompleteParseError)


def test_whitespace_is_not_implicitly_skipped():
    with pytest.raises(IncompleteParseError):
        evaluate("1 + 2")


def test_visitor_exceptions_are_wrapped():
    with pytest.raises(VisitationError):
        evaluate("1/0")
