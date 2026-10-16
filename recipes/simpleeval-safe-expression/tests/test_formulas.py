import pytest
from simpleeval import FeatureNotAvailable, FunctionNotDefined, IterableTooLong, NumberTooHigh, simple_eval

from formulas import evaluate


def test_custom_names_functions_and_builtins_kept():
    assert evaluate("clamp(qty * price, 0, 100)", {"qty": 5, "price": 30}) == 100
    assert evaluate("int('3') + total([1, 2])", {}) == 6


def test_function_registration_gotchas():
    with pytest.raises(FunctionNotDefined):
        evaluate("double(2)", {"double": lambda x: x * 2})
    with pytest.raises(FeatureNotAvailable):
        evaluate("1", {}, functions={"danger": eval})


def test_allowed_attrs_is_per_type():
    assert evaluate("code.upper()", {"code": "ab"}) == "AB"
    assert evaluate("n.bit_length()", {"n": 7}) == 3
    with pytest.raises(FeatureNotAvailable):
        evaluate("n.real", {"n": 3})


def test_dunder_attrs_blocked_even_without_allowlist():
    with pytest.raises(FeatureNotAvailable):
        evaluate("x.__class__", {"x": "hi"})
    with pytest.raises(FeatureNotAvailable):
        evaluate("x.__class__", {"x": "hi"}, allowed_attrs=None)


def test_arithmetic_and_size_limits():
    with pytest.raises(NumberTooHigh):
        evaluate("9 ** 9 ** 9", {})
    with pytest.raises(IterableTooLong):
        evaluate("'x' * 10 ** 7", {})


def test_compound_types_need_the_compound_evaluator():
    assert evaluate("[n * 2 for n in nums]", {"nums": [1, 2, 3]}) == [2, 4, 6]
    assert evaluate("{n: n * n for n in nums}", {"nums": [1, 2]}) == {1: 1, 2: 4}
    with pytest.raises(FeatureNotAvailable):
        simple_eval("[1, 2]")
