import pytest
from typeguard import CollectionCheckStrategy, TypeCheckError, check_type, typechecked

from checks import checked_sum, clamp, mean, pair, parse_ids


def test_argument_types_are_checked():
    assert clamp(5, 0, 10) == 5
    with pytest.raises(
        TypeCheckError, match=r'argument "value" \(str\) is not an instance of int'
    ):
        clamp("5", 0, 10)


def test_return_value_is_checked():
    @typechecked
    def bad() -> int:
        return "nope"  # type: ignore[return-value]

    with pytest.raises(
        TypeCheckError, match=r"the return value \(str\) is not an instance of int"
    ):
        bad()


def test_check_type_returns_value_and_raises():
    assert check_type(3, int) == 3
    with pytest.raises(TypeCheckError, match="str is not an instance of int"):
        check_type("3", int)


def test_container_check_is_first_item_by_default():
    # the default strategy only inspects element 0, so a bad tail slips through
    assert check_type([1, "a"], list[int]) == [1, "a"]
    with pytest.raises(TypeCheckError, match="item 1 of list is not an instance of int"):
        check_type(
            [1, "a"],
            list[int],
            collection_check_strategy=CollectionCheckStrategy.ALL_ITEMS,
        )
    assert parse_ids([1, 2]) == [1, 2]
    with pytest.raises(TypeCheckError, match="item 1 of list is not an instance of int"):
        parse_ids([1, "2"])


def test_sequence_accepts_numeric_tower():
    assert mean((1, 2, 3)) == 2.0
    with pytest.raises(
        TypeCheckError,
        match=r'item 0 of argument "values" \(str\) is neither float or int',
    ):
        mean("abc")


def test_only_bounded_typevars_are_enforced():
    assert checked_sum(1, 2.5) == 3.5
    with pytest.raises(
        TypeCheckError,
        match=r'argument "b" \(str\) is not an instance of numbers.Number',
    ):
        checked_sum(1, "a")
    # an unbounded TypeVar is treated as Any: no cross argument unification
    assert pair(1, "a") == (1, "a")
