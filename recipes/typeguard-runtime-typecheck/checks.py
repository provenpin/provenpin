from collections.abc import Sequence
from numbers import Number
from typing import TypeVar

from typeguard import CollectionCheckStrategy, check_type, typechecked

T = TypeVar("T", bound=Number)
U = TypeVar("U")


@typechecked
def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


@typechecked
def mean(values: Sequence[float]) -> float:
    return sum(values) / len(values)


@typechecked
def checked_sum(a: T, b: T) -> T:
    return a + b


@typechecked
def pair(a: U, b: U) -> tuple[U, U]:
    return a, b


def parse_ids(raw: object) -> list[int]:
    return check_type(
        raw, list[int], collection_check_strategy=CollectionCheckStrategy.ALL_ITEMS
    )
