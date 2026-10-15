import pandas as pd
import pandera.errors as pe
import pytest
from schemas import clean_orders

def frame(**over):
    base = {"order_id": [1, 2], "email": ["a@x.io", "b@x.io"], "quantity": ["3", "4"], "unit_price": [9.5, 1.0], "status": ["new", "paid"]}
    base.update(over)
    return pd.DataFrame(base)

def test_valid_and_coerced():
    out = clean_orders(frame())
    assert out["quantity"].tolist() == [3, 4]
    assert str(out["quantity"].dtype).startswith("int")

def test_lazy_collects_all_errors():
    with pytest.raises(pe.SchemaErrors) as e:
        clean_orders(frame(email=["bad", "b@x.io"], status=["new", "lost"], order_id=[1, 1]))
    cols = set(e.value.failure_cases["column"].dropna())
    assert {"email", "status", "order_id"} <= cols

def test_strict_and_dataframe_check():
    with pytest.raises(pe.SchemaErrors):
        clean_orders(frame(extra=[1, 2]))
    with pytest.raises(pe.SchemaErrors):
        clean_orders(frame(status=["shipped", "new"], quantity=[600, 1]))
