from datetime import datetime, timedelta, timezone
from decimal import Decimal

import cbor2
import pytest
from cbor2 import CBORTag

from cbor_codec import POINT_TAG, Point, decode, encode


def test_datetime_roundtrip_preserves_offset():
    dt = datetime(2021, 1, 1, 12, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))
    assert decode(encode(dt)) == dt


def test_naive_datetime_needs_timezone():
    naive = datetime(2021, 1, 1, 12, 0)
    with pytest.raises(cbor2.CBOREncodeError):
        encode(naive)
    assert decode(encode(naive, timezone=timezone.utc)) == naive.replace(tzinfo=timezone.utc)


def test_decimal_roundtrip_is_exact():
    result = decode(encode(Decimal("1.230")))
    assert result == Decimal("1.230")
    assert str(result) == "1.230"  # trailing zero survives, unlike a float roundtrip


def test_custom_tag_roundtrip_and_unknown_passthrough():
    assert decode(encode(Point(3, 4))) == Point(3, 4)
    assert decode(cbor2.dumps(CBORTag(999, "hi"))) == CBORTag(999, "hi")


def test_default_return_value_is_ignored():
    # default(encoder, value) must write via the encoder; a returned value is
    # dropped, leaving a truncated stream (empty when the root object is custom).
    out = cbor2.dumps(
        Point(1, 2), default=lambda enc, obj: CBORTag(POINT_TAG, [obj.x, obj.y])
    )
    assert out == b""


def test_canonical_encoding_is_insertion_order_independent():
    a = {"b": 1, "aa": 2}
    b = {"aa": 2, "b": 1}
    assert encode(a) != encode(b)
    assert encode(a, canonical=True) == encode(b, canonical=True)
