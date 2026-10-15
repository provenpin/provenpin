import msgspec
import pytest

from models import Circle, Order, Rect, Shape, order_from_dict, parse_order

RAW = (
    b'{"id":1,"label":"box","shapes":['
    b'{"type":"circle","radius":3},{"type":"rect","width":2,"height":4}]}'
)


def test_tagged_union_roundtrip_json_and_msgpack():
    order = parse_order(RAW)
    assert isinstance(order.shapes[0], Circle)
    assert isinstance(order.shapes[1], Rect)

    as_json = msgspec.json.decode(msgspec.json.encode(order), type=Order)
    as_mp = msgspec.msgpack.decode(msgspec.msgpack.encode(order), type=Order)
    assert as_json == order
    assert as_mp == order


def test_meta_constraint_error_reports_nested_path():
    bad = RAW.replace(b'"radius":3', b'"radius":0')
    with pytest.raises(msgspec.ValidationError, match=r"\$\.shapes\[0\]\.radius"):
        parse_order(bad)


def test_constructor_does_not_enforce_meta():
    # Meta constraints run on decode/convert, not on plain Struct __init__.
    assert Circle(radius=-1).radius == -1


def test_unknown_tag_and_unknown_fields_rejected():
    with pytest.raises(msgspec.ValidationError):
        msgspec.json.decode(b'{"type":"hexagon","radius":1}', type=Shape)

    extra = RAW.replace(b'"label":"box"', b'"label":"box","color":"red"')
    with pytest.raises(msgspec.ValidationError, match="color"):
        parse_order(extra)


def test_convert_from_dict_is_strict_by_default():
    data = {"id": "7", "label": "box", "shapes": [{"type": "circle", "radius": 2}]}
    with pytest.raises(msgspec.ValidationError):
        order_from_dict(data)

    order = order_from_dict(data, strict=False)
    assert order.id == 7
    assert order.shapes == [Circle(radius=2)]
