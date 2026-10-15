from enum import Enum

from pydantic import BaseModel, Field, HttpUrl


class Plan(str, Enum):
    free = "free"
    pro = "pro"


class Coupon(BaseModel):
    code: str = Field(pattern=r"^[A-Z]{2}-\d{4}$")


class Merchant(BaseModel):
    id: int = Field(ge=1)
    plan: Plan = Plan.free
    seats: int = Field(ge=1, le=100)
    callback_url: HttpUrl
