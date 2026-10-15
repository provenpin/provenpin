from decimal import Decimal
from pathlib import Path

import pytest
from cssselect import ExpressionError
from lxml import etree, html

from scrape import parse_products

FIXTURE = Path(__file__).parent / "fixtures" / "products.html"


def load() -> bytes:
    return FIXTURE.read_bytes()


def test_parses_typed_fields():
    products = parse_products(load())
    assert [p.sku for p in products] == ["A1", "B2"]
    assert products[0].price == Decimal("1299.50")
    assert products[1].price == Decimal("10.00")
    assert products[1].tags == ()
    assert products[1].in_stock is False


def test_direct_text_skips_child_badge():
    first = parse_products(load())[0]
    assert first.name == "Widget"
    assert first.tags == ("tools", "sale")


def test_missing_attribute_is_none():
    markup = b'<ul class="products"><li class="product"><span class="price">$1</span></li></ul>'
    (product,) = parse_products(markup)
    assert product.sku is None
    assert product.in_stock is False


def test_pseudo_elements_are_not_supported():
    doc = html.document_fromstring(load())
    with pytest.raises(ExpressionError):
        doc.cssselect("li.product::before")


def test_encoding_declaration_needs_bytes():
    unicode_markup = '<?xml version="1.0" encoding="utf-8"?><html></html>'
    with pytest.raises(ValueError):
        etree.fromstring(unicode_markup)
    assert etree.fromstring(unicode_markup.encode()).tag == "html"
