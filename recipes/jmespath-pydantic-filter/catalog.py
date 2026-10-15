from datetime import datetime
from enum import Enum

import jmespath
from pydantic import BaseModel


class Category(Enum):
    book = "book"
    game = "game"


class Item(BaseModel):
    name: str
    price: float
    category: Category = Category.book
    created: datetime | None = None


class Catalog(BaseModel):
    name: str
    items: list[Item]


def records(items: list[Item]) -> list[dict]:
    # mode="json" turns datetime/Enum members into JSON primitives so jmespath
    # comparisons against literals actually match.
    return [item.model_dump(mode="json") for item in items]


def search(items: list[Item], expression: str, default=None):
    result = jmespath.search(expression, records(items))
    return default if result is None else result


def names_cheaper_than(items: list[Item], limit: float) -> list[str]:
    return search(items, f"[?price < `{limit}`].name", [])


def by_category(items: list[Item], category: Category) -> list[str]:
    return search(items, f"[?category == '{category.value}'].name", [])


def search_catalog(catalog: Catalog, expression: str, default=None):
    result = jmespath.search(expression, catalog.model_dump(mode="json"))
    return default if result is None else result
