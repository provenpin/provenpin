from datetime import datetime

import jmespath

from catalog import (
    Catalog,
    Category,
    Item,
    by_category,
    names_cheaper_than,
    records,
    search,
    search_catalog,
)


def test_filter_by_numeric_literal():
    items = [Item(name="pen", price=1.5), Item(name="laptop", price=999.0)]
    assert names_cheaper_than(items, 100) == ["pen"]


def test_list_root_needs_star_projection():
    items = [Item(name="pen", price=1.5)]
    assert jmespath.search("name", records(items)) is None
    assert search(items, "[*].name") == ["pen"]


def test_datetime_needs_json_mode():
    item = Item(name="pen", price=1.0, created=datetime(2024, 1, 1, 12, 0, 0))
    expr = "[?created == '2024-01-01T12:00:00'].name"
    # default model_dump keeps a datetime object, which never equals the literal
    assert jmespath.search(expr, [item.model_dump()]) == []
    assert search([item], expr) == ["pen"]


def test_enum_needs_json_mode():
    item = Item(name="pen", price=1.0, category=Category.game)
    expr = "[?category == 'game'].name"
    assert jmespath.search(expr, [item.model_dump()]) == []
    assert search([item], expr) == ["pen"]


def test_missing_keys_are_silent():
    items = [Item(name="pen", price=1.0)]
    assert search(items, "[?missing == 'x'].name", []) == []
    assert search(items, "[0].missing") is None
    assert by_category(items, Category.game) == []


def test_nested_catalog_dump():
    catalog = Catalog(
        name="shop",
        items=[Item(name="pen", price=1.5), Item(name="laptop", price=999.0)],
    )
    assert search_catalog(catalog, "items[?price < `100`].name") == ["pen"]
