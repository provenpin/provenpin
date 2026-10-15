import polars as pl

from rows import validate_frame

GOOD = {
    "order_id": [1, 2],
    "customer": ["ann", "bo"],
    "amount": [9.5, 0.0],
    "status": ["paid", "refunded"],
    "note": [None, "gift"],
}

def test_all_valid():
    valid, errors = validate_frame(pl.DataFrame(GOOD))
    assert [o.order_id for o in valid] == [1, 2]
    assert valid[1].note == "gift"
    assert errors == []

def test_bad_rows_collected_not_raised():
    df = pl.DataFrame({
        "order_id": [1, None, 3],        # null -> int error
        "customer": ["ann", "bo", ""],   # empty -> min_length error
        "amount": [1.0, 2.0, 3.0],
        "status": ["paid", "paid", "void"],  # "void" -> literal error
        "note": [None, None, None],
    })
    valid, errors = validate_frame(df)
    assert [o.order_id for o in valid] == [1]
    assert [e["row"] for e in errors] == [1, 2]
    assert errors[0]["errors"][0]["loc"] == ("order_id",)
    assert {e["loc"] for e in errors[1]["errors"]} == {("customer",), ("status",)}

def test_strict_mode_rejects_numeric_strings():
    # Polars keeps "1" as a string column; lax pydantic would silently coerce it.
    df = pl.DataFrame({**GOOD, "order_id": ["1", "2"]})
    valid, errors = validate_frame(df)
    assert valid == []
    assert len(errors) == 2
    assert errors[0]["errors"][0]["type"] == "int_type"

def test_nan_rejected_by_allow_inf_nan_false():
    # NaN is not null in polars, so a null check alone would let it through.
    df = pl.DataFrame({**GOOD, "amount": [float("nan"), 1.0]})
    valid, errors = validate_frame(df)
    assert [o.order_id for o in valid] == [2]
    assert errors[0]["errors"][0]["type"] == "finite_number"

def test_extra_column_is_an_error():
    df = pl.DataFrame({**GOOD, "debug": ["x", "y"]})
    valid, errors = validate_frame(df)
    assert valid == []
    assert errors[0]["errors"][0]["type"] == "extra_forbidden"
    assert errors[0]["errors"][0]["loc"] == ("debug",)
