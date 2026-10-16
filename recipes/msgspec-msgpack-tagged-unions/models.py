from typing import Union

import msgspec


class Created(msgspec.Struct, tag="created", forbid_unknown_fields=True):
    id: int
    name: str


class Deleted(msgspec.Struct, tag="deleted", forbid_unknown_fields=True):
    id: int
    reason: str


Event = Union[Created, Deleted]

DECODER = msgspec.json.Decoder(Event)


def to_msgpack(event: Event) -> bytes:
    return msgspec.msgpack.encode(event)


def from_msgpack(data: bytes) -> Event:
    return msgspec.msgpack.decode(data, type=Event)


def to_json(event: Event) -> bytes:
    return msgspec.json.encode(event)


def from_json(data: bytes) -> Event:
    return msgspec.json.decode(data, type=Event)
