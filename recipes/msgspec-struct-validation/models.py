from typing import Annotated

import msgspec

PositiveInt = Annotated[int, msgspec.Meta(gt=0)]
Label = Annotated[str, msgspec.Meta(min_length=1, max_length=40)]


class Circle(msgspec.Struct, tag="circle"):
    radius: PositiveInt


class Rect(msgspec.Struct, tag="rect"):
    width: PositiveInt
    height: PositiveInt


# Tagged union: the "type" field selects the variant during decode.
Shape = Circle | Rect


class Order(msgspec.Struct, kw_only=True, forbid_unknown_fields=True):
    id: int
    label: Label
    shapes: list[Shape] = msgspec.field(default_factory=list)


def parse_order(raw: bytes) -> Order:
    return msgspec.json.decode(raw, type=Order)


def order_from_dict(data: dict, strict: bool = True) -> Order:
    return msgspec.convert(data, Order, strict=strict)
