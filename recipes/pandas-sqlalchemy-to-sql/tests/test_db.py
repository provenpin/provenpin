import pandas as pd
import pytest
import sqlalchemy as sa
from db import make_engine, save_frame, load_frame

def orders():
    return pd.DataFrame({
        "sku": ["A1", "B2", "C3"],
        "qty": pd.array([1, None, 3], dtype="Int64"),
        "price": [9.5, 4.0, 12.25],
        "ts": pd.to_datetime(["2024-01-01 10:00", "2024-01-02 11:30", "2024-01-03 09:15"]),
    })

@pytest.fixture
def engine():
    return make_engine()

def test_no_index_column_written(engine):
    save_frame(orders(), engine, "orders")
    cols = [c["name"] for c in sa.inspect(engine).get_columns("orders")]
    assert cols == ["sku", "qty", "price", "ts"]

def test_dtype_controls_column_types(engine):
    save_frame(orders(), engine, "orders", dtype={"sku": sa.String(10), "qty": sa.Integer})
    types = {c["name"]: str(c["type"]) for c in sa.inspect(engine).get_columns("orders")}
    assert types["sku"] == "VARCHAR(10)" and types["qty"] == "INTEGER"

def test_nullable_int_roundtrip(engine):
    save_frame(orders(), engine, "orders")
    # Without dtype_backend="numpy_nullable", NULLs come back as float NaN, not Int64 <NA>
    back = load_frame(engine, "SELECT * FROM orders ORDER BY sku", dtype_backend="numpy_nullable")
    assert str(back["qty"].dtype) == "Int64"
    assert back["qty"].isna().tolist() == [False, True, False]

def test_datetimes_are_text_until_parse_dates(engine):
    save_frame(orders(), engine, "orders")
    # sqlite has no datetime type, so pandas stores timestamps as text
    raw = load_frame(engine, "SELECT ts FROM orders")
    assert isinstance(raw["ts"].iloc[0], str)
    parsed = load_frame(engine, "SELECT ts FROM orders", parse_dates=["ts"])
    assert pd.api.types.is_datetime64_any_dtype(parsed["ts"])

def test_bound_params_instead_of_string_formatting(engine):
    save_frame(orders(), engine, "orders")
    out = load_frame(engine, "SELECT sku FROM orders WHERE sku = :s", params={"s": "B2"})
    assert out["sku"].tolist() == ["B2"]

def test_if_exists_fail_raises(engine):
    save_frame(orders(), engine, "orders")
    with pytest.raises(ValueError):
        save_frame(orders(), engine, "orders", if_exists="fail")
