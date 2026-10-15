from typing import Annotated, Literal

from fastapi import FastAPI
from pydantic import AfterValidator, BaseModel, Field

app = FastAPI()


def luhn(v: str) -> str:
    total = 0
    for i, ch in enumerate(reversed(v)):
        d = int(ch)
        if i % 2:  # double every second digit from the right
            d = d * 2 - 9 if d > 4 else d * 2
        total += d
    if total % 10:
        raise ValueError("Luhn checksum failed")
    return v


class Card(BaseModel):
    kind: Literal["card"]
    number: Annotated[str, Field(pattern=r"^\d{12,19}$"), AfterValidator(luhn)]


class Bank(BaseModel):
    kind: Literal["bank"]
    iban: Annotated[str, Field(min_length=15, max_length=34)]


# The discriminator must be a Literal on every branch; a plain Union
# would try each branch and produce noisier errors.
Payment = Annotated[Card | Bank, Field(discriminator="kind")]


class Order(BaseModel):
    amount: Annotated[int, Field(gt=0)]
    payment: Payment


@app.post("/orders")
def create_order(order: Order):
    return {"ok": True, "kind": order.payment.kind}
