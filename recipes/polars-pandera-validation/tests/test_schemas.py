import polars as pl
import pytest
from pandera.errors import SchemaError, SchemaErrors
from schemas import Orders, StrictOrders, validate_orders

def good_frame() -> pl.DataFrame:
    return pl.DataFrame({"order_id": [1, 2], "amount": [9.5, 0.0], "currency": ["USD", "EUR"]})

def bad_frame() -> pl.DataFrame:
    # three independent failures: order_id < 1, amount < 0, currency not allowed
    return pl.DataFrame({"order_id": [0, 2], "amount": [-1.0, 3.0], "currency": ["GBP", "EUR"]})

def test_valid_frame_passes():
    assert validate_orders(good_frame()).height == 2

def test_lazy_collects_all_errors():
    with pytest.raises(SchemaErrors) as exc:
        validate_orders(bad_frame())
    columns = set(exc.value.failure_cases["column"].to_list())
    assert columns == {"order_id", "amount", "currency"}

def test_eager_stops_at_first_error():
    # default lazy=False raises on the first failing check only
    with pytest.raises(SchemaError):
        Orders.validate(bad_frame())

def test_nulls_fail_by_default():
    df = pl.DataFrame({"order_id": [1, None], "amount": [1.0, 2.0], "currency": ["USD", "EUR"]})
    with pytest.raises(SchemaErrors):
        validate_orders(df)

def test_extra_columns_need_strict():
    df = good_frame().with_columns(pl.lit("x").alias("note"))
    Orders.validate(df)  # extra columns allowed by default
    with pytest.raises(SchemaErrors):
        StrictOrders.validate(df, lazy=True)
