import pytest
from pyparsing import ParseException

from grammar import build_parser, evaluate


def test_precedence_and_parentheses():
    assert evaluate("2 + 3 * 4") == 14
    assert evaluate("(2 + 3) * 4") == 20


def test_exponent_is_right_associative():
    assert evaluate("2 ^ 3 ^ 2") == 512


def test_unary_minus_binds_tighter_than_power():
    assert evaluate("-2 ^ 2") == 4
    assert evaluate("10 - -5") == 15


def test_variables_are_substituted():
    assert evaluate("price * qty + 1", price=2.5, qty=4) == 11.0


def test_undefined_variable_raises():
    with pytest.raises(ValueError, match="undefined variable: x"):
        evaluate("x + 1")


def test_parse_all_rejects_trailing_garbage():
    parser = build_parser()
    assert parser.parse_string("1 + 2 ignored")[0] == 3
    with pytest.raises(ParseException):
        evaluate("1 + 2 ignored")
