from result import Err, Ok, Result, as_result


@as_result(ValueError)
def parse_int(raw: str) -> int:
    return int(raw)


def positive(n: int) -> Result[int, str]:
    return Ok(n) if n > 0 else Err(f"not positive: {n}")


def reciprocal(n: int) -> Result[float, str]:
    return Err("division by zero") if n == 0 else Ok(1 / n)


def run(raw: str) -> Result[float, str]:
    # No try/except: each step returns a Result and the chain stops on the first Err.
    return (
        parse_int(raw)
        .map_err(lambda exc: f"bad number {raw!r}: {exc}")
        .and_then(positive)
        .and_then(reciprocal)
    )
