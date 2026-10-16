from returns.io import IOResult, IOSuccess, IOFailure, impure_safe
from returns.maybe import Maybe, Nothing, Some, maybe
from returns.result import Failure, Result, Success

_TAKEN = {3, 7}


@maybe
def parse_seat(raw: str) -> int | None:
    return int(raw) if raw.isdigit() else None


def in_range(number: int) -> Maybe[int]:
    return Some(number) if 1 <= number <= 9 else Nothing


def maybe_to_result(value: Maybe[int], error: str) -> Result[int, str]:
    return value.map(Success).value_or(Failure(error))


@impure_safe
def reserve(number: int) -> str:
    if number in _TAKEN:
        raise ValueError(f"seat {number} taken")
    return f"seat-{number}"


def checkout(raw: str) -> IOResult[str, str]:
    seat = parse_seat(raw).bind(in_range)
    return IOResult.from_result(maybe_to_result(seat, f"invalid seat: {raw}")).bind(reserve)
