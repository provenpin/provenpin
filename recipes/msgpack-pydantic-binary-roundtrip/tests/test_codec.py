from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

import msgpack
import pytest
from pydantic import BaseModel, ValidationError

from codec import Item, Order, pack_model, unpack_model


@pytest.fixture
def order() -> Order:
    return Order(
        id=UUID("12345678-1234-5678-1234-567812345678"),
        placed_at=datetime(2024, 1, 2, 3, 4, 5),
        items=[Item(sku="a", qty=2, price=Decimal("19.99"))],
        attrs={1: "one", 2: "two"},
    )


def test_roundtrip_preserves_rich_types(order):
    back = unpack_model(Order, pack_model(order))
    assert back == order
    assert isinstance(back.id, UUID)
    assert isinstance(back.placed_at, datetime)
    assert back.items[0].price == Decimal("19.99")
    assert back.attrs == {1: "one", 2: "two"}


def test_python_mode_leaks_scalars_msgpack_cannot_pack(order):
    with pytest.raises(TypeError):
        msgpack.packb(order.model_dump())


class Stamp(BaseModel):
    at: datetime


def test_timestamp_ext_needs_timestamp_arg_to_rebuild_datetime():
    at = datetime(2024, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
    raw = msgpack.packb({"at": msgpack.Timestamp(int(at.timestamp()))})
    default = msgpack.unpackb(raw)
    assert isinstance(default["at"], msgpack.Timestamp)
    with pytest.raises(ValidationError):
        Stamp.model_validate(default)
    assert Stamp.model_validate(msgpack.unpackb(raw, timestamp=3)).at == at


class Counts(BaseModel):
    by_id: dict[int, str]


def test_non_string_map_keys_need_strict_map_key_false():
    raw = msgpack.packb(Counts(by_id={1: "one"}).model_dump())
    with pytest.raises(ValueError):
        msgpack.unpackb(raw)
    assert msgpack.unpackb(raw, strict_map_key=False)["by_id"] == {1: "one"}


def test_bytes_survive_only_with_use_bin_type():
    payload = {"blob": b"\x00\x01"}
    intact = msgpack.unpackb(msgpack.packb(payload), raw=False)
    assert intact["blob"] == b"\x00\x01"
    corrupted = msgpack.unpackb(msgpack.packb(payload, use_bin_type=False), raw=False)
    assert corrupted["blob"] == "\x00\x01"
