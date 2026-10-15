from typing import Literal

import polars as pl
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, ValidationError

class Order(BaseModel):
    # strict: no "5" -> 5 coercion; extra="forbid": unexpected columns are errors
    model_config = ConfigDict(strict=True, extra="forbid")

    order_id: int
    customer: str = Field(min_length=1)
    amount: float = Field(ge=0, allow_inf_nan=False)
    status: Literal["paid", "refunded"]
    note: str | None = None

ORDER = TypeAdapter(Order)

def validate_frame(df: pl.DataFrame) -> tuple[list[Order], list[dict]]:
    # Validate row by row so one bad row does not hide the rest.
    # iter_rows(named=True) gives dicts; plain tuples would not map to field names.
    valid, errors = [], []
    for i, row in enumerate(df.iter_rows(named=True)):
        try:
            valid.append(ORDER.validate_python(row))
        except ValidationError as e:
            errors.append({"row": i, "errors": e.errors(include_url=False)})
    return valid, errors
