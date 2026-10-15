from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from shop.models import Product


@pytest.fixture
def api(db):
    Product.objects.bulk_create([
        Product(name="Pen", price=Decimal("3.50")),
        Product(name="Notebook", price=Decimal("12.00")),
        Product(name="Desk", price=Decimal("150.00")),
        Product(name="Lamp", price=Decimal("25.00")),
        Product(name="Mug", price=Decimal("8.00")),
    ])
    return APIClient()


def test_range_and_exact_filters(api):
    r = api.get("/products/", {"min_price": "5", "max_price": "20"})
    assert r.status_code == 200
    assert r.data["count"] == 2
    assert {p["name"] for p in r.data["results"]} == {"Notebook", "Mug"}

    r = api.get("/products/", {"name": "Desk"})
    assert [p["name"] for p in r.data["results"]] == ["Desk"]


def test_ordering_descending_by_price(api):
    r = api.get("/products/", {"ordering": "-price"})
    assert [p["name"] for p in r.data["results"]] == ["Desk", "Lamp"]


def test_pagination_counts_filtered_queryset(api):
    # count and pages reflect the filter, not the whole table
    page1 = api.get("/products/", {"min_price": "5", "page": 1})
    page2 = api.get("/products/", {"min_price": "5", "page": 2})
    assert page1.data["count"] == 4
    assert page2.data["count"] == 4
    names = [p["name"] for p in page1.data["results"] + page2.data["results"]]
    assert len(names) == len(set(names)) == 4


def test_invalid_decimal_filter_returns_400(api):
    r = api.get("/products/", {"min_price": "cheap"})
    assert r.status_code == 400


def test_create_roundtrips_decimal_as_string(api):
    r = api.post("/products/", {"name": "Chair", "price": "42.5"}, format="json")
    assert r.status_code == 201
    # DRF renders DecimalField as a string padded to decimal_places
    assert r.data["price"] == "42.50"
