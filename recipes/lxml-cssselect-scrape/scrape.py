from dataclasses import dataclass
from decimal import Decimal

from lxml import html
from lxml.cssselect import CSSSelector

PRODUCTS = CSSSelector("ul.products > li.product")


@dataclass(frozen=True)
class Product:
    sku: str | None
    name: str
    price: Decimal
    in_stock: bool
    tags: tuple[str, ...]


def _one(node, selector: str):
    matches = node.cssselect(selector)
    return matches[0] if matches else None


def _parse_price(text: str) -> Decimal:
    return Decimal(text.strip().replace("$", "").replace(",", ""))


def parse_products(markup: bytes) -> list[Product]:
    doc = html.document_fromstring(markup)
    products: list[Product] = []
    for li in PRODUCTS(doc):
        price_el = _one(li, ".price")
        if price_el is None:
            continue
        name_el = _one(li, ".name")
        stock_el = _one(li, ".stock")
        products.append(
            Product(
                sku=li.get("data-sku"),
                name=(name_el.text or "").strip() if name_el is not None else "",
                price=_parse_price(price_el.text_content()),
                in_stock=stock_el is not None and stock_el.text_content().strip() == "in stock",
                tags=tuple(tag.text_content().strip() for tag in li.cssselect(".tag")),
            )
        )
    return products
