import polars as pl
import pandera.polars as pa
from pandera.typing.polars import Series

class Orders(pa.DataFrameModel):
    order_id: Series[int] = pa.Field(ge=1)
    amount: Series[float] = pa.Field(ge=0)
    currency: Series[str] = pa.Field(isin=["USD", "EUR"])

class StrictOrders(Orders):
    class Config:
        strict = True  # reject columns that are not declared in the schema

def validate_orders(df: pl.DataFrame) -> pl.DataFrame:
    """Return df if valid; raise SchemaErrors listing every failing check."""
    return Orders.validate(df, lazy=True)
