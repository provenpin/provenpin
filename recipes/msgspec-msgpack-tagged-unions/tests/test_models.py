import msgspec
import pytest
from models import (
    DECODER,
    Created,
    Deleted,
    from_json,
    from_msgpack,
    to_json,
    to_msgpack,
)


def test_msgpack_roundtrip_picks_subtype():
    data = to_msgpack(Deleted(2, "spam"))
    assert b"deleted" in data
    event = from_msgpack(data)
    assert isinstance(event, Deleted) and event.reason == "spam"


def test_json_carries_the_tag_field():
    assert to_json(Created(1, "a")) == b'{"type":"created","id":1,"name":"a"}'
    assert from_json(b'{"type":"deleted","id":9,"reason":"z"}') == Deleted(9, "z")


def test_unknown_tag_is_rejected():
    with pytest.raises(msgspec.ValidationError):
        from_json(b'{"type":"archived","id":1}')


def test_missing_tag_is_rejected():
    with pytest.raises(msgspec.ValidationError):
        from_msgpack(msgspec.msgpack.encode({"id": 1, "name": "a"}))


def test_strict_fields_reject_extras():
    with pytest.raises(msgspec.ValidationError):
        from_json(b'{"type":"created","id":1,"name":"a","extra":true}')


def test_msgpack_is_compact_and_decoder_is_reusable():
    event = Created(1, "a")
    assert len(to_msgpack(event)) < len(to_json(event))
    assert DECODER.decode(b'{"type":"created","id":1,"name":"a"}') == event
