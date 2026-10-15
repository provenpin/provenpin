import sqlite3

import pytest
from pydantic import BaseModel, TypeAdapter, ValidationError
from ulid import ULID

from ulids import Ulid, User, UserStore


class PlainUser(BaseModel):
    id: ULID


def test_lowercase_string_is_normalized():
    uid = ULID()
    with pytest.raises(ValidationError):
        PlainUser(id=str(uid).lower())  # ULID.from_str rejects lowercase
    user = User(id=str(uid).lower(), name="ada")
    assert isinstance(user.id, ULID)
    assert user.id == uid
    assert str(user.id) == str(uid).upper()


def test_invalid_values_are_rejected():
    for bad in ("not-a-ulid", "0" + "I" * 25, 26 * "U", b"\x00" * 8):
        with pytest.raises(ValidationError):
            User(id=bad, name="x")


def test_json_round_trip_is_canonical_string():
    user = User(id=ULID(), name="ada")
    payload = user.model_dump_json()
    assert f'"id":"{user.id}"' in payload  # uppercase 26 char string
    assert User.model_validate_json(payload).id == user.id
    assert isinstance(user.model_dump()["id"], ULID)  # python mode keeps the rich type


def test_json_schema_is_a_plain_string():
    schema = TypeAdapter(Ulid).json_schema()
    assert schema["type"] == "string" and "anyOf" not in schema
    assert "anyOf" in TypeAdapter(ULID).json_schema()  # built in schema also allows 16 bytes


def test_ulids_order_chronologically_and_lexicographically():
    ids = [ULID.from_timestamp(seconds) for seconds in (2.0, 1.0, 3.0)]
    ordered = sorted(ids)
    assert [u.timestamp for u in ordered] == [1.0, 2.0, 3.0]
    assert [str(u) for u in ordered] == sorted(str(u) for u in ids)


def test_sqlite_primary_key_keeps_insertion_independent_order():
    store = UserStore()
    users = [User(id=ULID.from_timestamp(s), name=f"u{s}") for s in (3.0, 1.0, 2.0)]
    for user in users:
        store.add(user)
    assert [u.id.timestamp for u in store.all()] == [1.0, 2.0, 3.0]
    with pytest.raises(sqlite3.IntegrityError):
        store.add(users[0])
