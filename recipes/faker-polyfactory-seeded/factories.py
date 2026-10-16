from typing import Annotated, Literal

from faker import Faker
from polyfactory import Use
from polyfactory.factories.pydantic_factory import ModelFactory
from pydantic import BaseModel, Field


class Address(BaseModel):
    city: str
    country_code: Annotated[str, Field(pattern=r"^[A-Z]{2}$")]


class Customer(BaseModel):
    id: int
    email: str
    age: int = Field(ge=18, le=99)
    plan: Literal["free", "pro"]
    address: Address


class CustomerFactory(ModelFactory[Customer]):
    # no __faker__ of its own, so it inherits the Faker shared by every factory
    __model__ = Customer


_fake = Faker()


class SeededCustomerFactory(ModelFactory[Customer]):
    # bind one Faker instance so seed_random() and Use() drive the same generator
    __model__ = Customer
    __faker__ = _fake
    email = Use(_fake.email)


def reseed(factory: type[ModelFactory[Customer]], seed: int) -> type[ModelFactory[Customer]]:
    factory.seed_random(seed)
    return factory
