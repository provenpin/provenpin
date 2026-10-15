from enum import StrEnum
from pydantic import BaseModel, ConfigDict, Field, field_validator

class Category(StrEnum):
    TOOL = "tool"
    FOOD = "food"

class Item(BaseModel):
    model_config = ConfigDict(frozen=True)

    sku: str = Field(min_length=1, max_length=12)
    qty: int = Field(ge=0)
    price: float = Field(ge=0, allow_inf_nan=False)
    category: Category
    tags: tuple[str, ...] = ()

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, v: str) -> str:
        # Strip and uppercase. Whitespace-only input must fail, not become "".
        v = v.strip().upper()
        if not v:
            raise ValueError("sku must not be blank")
        # max_length runs BEFORE this validator, and upper() can grow a string
        # ("\u00df" -> "SS"), so re-check the length after normalizing.
        if len(v) > 12:
            raise ValueError("sku too long after normalization")
        return v
