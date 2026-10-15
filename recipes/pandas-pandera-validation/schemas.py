import pandas as pd
import pandera.pandas as pa
from pandera.typing.pandas import Series

class Orders(pa.DataFrameModel):
    order_id: Series[int] = pa.Field(unique=True, ge=1)
    email: Series[str] = pa.Field(str_matches=r"^[^@]+@[^@]+$")
    quantity: Series[int] = pa.Field(ge=1, le=1000)
    unit_price: Series[float] = pa.Field(gt=0)
    status: Series[str] = pa.Field(isin=["new", "paid", "shipped"])

    class Config:
        coerce = True   # "3" -> 3, etc.
        strict = True   # unknown columns are errors

    @pa.dataframe_check
    def shipped_orders_are_small(cls, df: pd.DataFrame) -> Series[bool]:
        return ~((df["status"] == "shipped") & (df["quantity"] > 500))

def clean_orders(df: pd.DataFrame) -> pd.DataFrame:
    return Orders.validate(df, lazy=True)  # lazy=True collects every failure
