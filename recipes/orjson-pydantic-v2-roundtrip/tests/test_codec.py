import datetime
import uuid
from decimal import Decimal
from enum import Enum

import orjson
import pytest
from pydantic import BaseModel, SecretStr

from codec import dumps, loads


class Color(str, Enum):
    red = "red"


class Event(BaseModel):
    name: str
    at: datetime.datetime
    price: Decimal
    uid: uuid.UUID
    labels: dict[int, str]
    color: Color


class Account(BaseModel):
    user: str
    token: SecretStr


class ZFirst(BaseModel):
    z: int
    a: int


class AFirst(BaseModel):
    a: int
    z: int


def make_event(**overrides) -> Event:
    data = dict(
        name="deploy",
        at=datetime.datetime(2024, 1, 2, 3, 4, 5),
        price=Decimal("19.90"),
        uid=uuid.UUID(int=1),
        labels={7: "prod"},
        color=Color.red,
    )
    data.update(overrides)
    return Event(**data)


def test_roundtrip_is_lossless_over_bytes():
    event = make_event()
    payload = dumps(event)
    assert isinstance(payload, bytes)
    restored = loads(payload, Event)
    assert restored == event
    assert restored.price == Decimal("19.90")


def test_orjson_needs_a_default_for_models():
    event = make_event()
    with pytest.raises(TypeError):
        orjson.dumps(event)
    assert loads(dumps(event), Event) == event


def test_sort_keys_is_field_order_independent():
    assert dumps(ZFirst(z=1, a=2), sort_keys=True) == dumps(AFirst(a=2, z=1), sort_keys=True)
    assert dumps(ZFirst(z=1, a=2), sort_keys=True) == b'{"a":2,"z":1}'


def test_utc_z_option_makes_naive_datetimes_aware():
    event = make_event(at=datetime.datetime(2024, 1, 2, 3, 4, 5))
    raw = orjson.loads(dumps(event, utc_z=True))
    assert raw["at"] == "2024-01-02T03:04:05Z"
    restored = loads(dumps(event, utc_z=True), Event)
    assert restored.at.utcoffset() == datetime.timedelta(0)
    assert restored != event


def test_secretstr_is_masked_and_roundtrip_is_lossy():
    account = Account(user="ada", token="s3cr3t")
    assert orjson.loads(dumps(account)) == {"user": "ada", "token": "**********"}
    restored = loads(dumps(account), Account)
    assert restored.token.get_secret_value() == "**********"
    assert restored != account


def test_non_str_keys_are_stringified_for_json():
    raw = orjson.loads(dumps(make_event(labels={7: "prod"})))
    assert raw["labels"] == {"7": "prod"}
    with pytest.raises(TypeError):
        orjson.dumps({7: "prod"})
