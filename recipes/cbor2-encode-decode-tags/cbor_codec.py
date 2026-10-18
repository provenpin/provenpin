from __future__ import annotations

from typing import Any

import cbor2
from cbor2 import CBORTag

POINT_TAG = 40001


class Point:
    def __init__(self, x: int, y: int) -> None:
        self.x = x
        self.y = y

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Point) and (self.x, self.y) == (other.x, other.y)

    def __repr__(self) -> str:
        return f"Point({self.x}, {self.y})"


def _default(encoder: cbor2.CBOREncoder, obj: Any) -> None:
    # cbor2 6.x passes the encoder: encode through it, do not return a value.
    if isinstance(obj, Point):
        encoder.encode_semantic(POINT_TAG, [obj.x, obj.y])
    else:
        raise cbor2.CBOREncodeTypeError(f"cannot encode {type(obj).__name__}")


def _tag_hook(tag: CBORTag, immutable: bool) -> Any:
    if tag.tag == POINT_TAG:
        x, y = tag.value
        return Point(x, y)
    return tag


def encode(obj: Any, *, canonical: bool = False, timezone=None) -> bytes:
    return cbor2.dumps(obj, default=_default, canonical=canonical, timezone=timezone)


def decode(data: bytes) -> Any:
    return cbor2.loads(data, tag_hook=_tag_hook)
