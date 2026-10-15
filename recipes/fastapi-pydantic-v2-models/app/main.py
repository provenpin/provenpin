from datetime import date
from typing import Annotated, Literal, Union
from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator, model_validator

class Card(BaseModel):
    kind: Literal["card"]
    number: str = Field(pattern=r"^\d{16}$")

class Bank(BaseModel):
    kind: Literal["bank"]
    iban: str

Payment = Annotated[Union[Card, Bank], Field(discriminator="kind")]

class OrderIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    email: str
    quantity: int = Field(gt=0, le=100)
    unit_price: float = Field(gt=0)
    ship_on: date | None = None
    payment: Payment

    @field_validator("email")
    @classmethod
    def lower_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("not an email")
        return v.lower()

    @model_validator(mode="after")
    def bulk_needs_bank(self):
        if self.quantity > 50 and self.payment.kind != "bank":
            raise ValueError("orders over 50 units must pay by bank transfer")
        return self

class OrderOut(BaseModel):
    email: str
    quantity: int
    unit_price: float
    payment_kind: str

    @computed_field
    @property
    def total(self) -> float:
        return round(self.quantity * self.unit_price, 2)

app = FastAPI()

@app.post("/orders", response_model=OrderOut, status_code=201)
def create_order(order: OrderIn):
    return OrderOut(email=order.email, quantity=order.quantity, unit_price=order.unit_price, payment_kind=order.payment.kind)
