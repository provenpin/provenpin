from datetime import datetime, timezone
from typing import Annotated

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
)


def unformat_number(v: object) -> object:
    if isinstance(v, str):
        return v.replace("$", "").replace(",", "").strip()
    return v


def reject_negative(v: float) -> float:
    if v < 0:
        raise ValueError("must be non-negative")
    return v


def as_utc(v: datetime) -> datetime:
    if v.tzinfo is None:
        return v.replace(tzinfo=timezone.utc)
    return v.astimezone(timezone.utc)


def lower_all(v: list[str]) -> list[str]:
    return [t.lower() for t in v]


def append_a(v: list[str]) -> list[str]:
    return [*v, "a"]


def append_b(v: list[str]) -> list[str]:
    return [*v, "b"]


Money = Annotated[float, BeforeValidator(unformat_number), AfterValidator(reject_negative)]
Tags = Annotated[list[str], AfterValidator(lower_all)]
Ordered = Annotated[list[str], AfterValidator(append_a), AfterValidator(append_b)]


class Product(BaseModel):
    name: str
    price: Money
    updated_at: Annotated[datetime, AfterValidator(as_utc)]
    tags: Tags = Field(default_factory=list)


class LazySettings(BaseModel):
    retries: Annotated[int, AfterValidator(lambda v: v + 1)] = 3


class StrictSettings(BaseModel):
    model_config = ConfigDict(validate_default=True)
    retries: Annotated[int, AfterValidator(lambda v: v + 1)] = 3
