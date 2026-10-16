import datetime as dt

import msgspec
import orjson
import pytest
from parity import (
    assert_parity,
    decode_as,
    msgspec_bytes,
    orjson_bytes,
)


def test_sorted_scalars_have_byte_parity():
    payload = {"b": 1, "a": [1, 2.5, "x", True, None]}
    o, m = orjson_bytes(payload, sort_keys=True), msgspec_bytes(payload, sort_keys=True)
    assert o == m == b'{"a":[1,2.5,"x",true,null],"b":1}'
    assert_parity(payload)


def test_utc_datetime_suffix_is_not_parity():
    when = dt.datetime(2024, 1, 2, 3, 4, 5, tzinfo=dt.timezone.utc)
    assert orjson_bytes(when, sort_keys=True) == b'"2024-01-02T03:04:05+00:00"'
    assert msgspec_bytes(when, sort_keys=True) == b'"2024-01-02T03:04:05Z"'
    with pytest.raises(AssertionError):
        assert_parity({"at": when})


def test_int_keys_need_non_str_option():
    with pytest.raises(TypeError):
        orjson.dumps({1: "a"})
    assert orjson_bytes({1: "a"}) == b'{"1":"a"}'
    assert orjson_bytes({1: "a", 2: "b"}) == msgspec_bytes({1: "a", 2: "b"})
    with pytest.raises(TypeError):
        msgspec.json.encode({1: "a"}, order="sorted")


def test_non_finite_floats_collapse_to_null():
    assert_parity({"nan": float("nan"), "inf": float("inf")})
    assert msgspec.json.decode(msgspec_bytes({"x": float("nan")})) == {"x": None}


class User(msgspec.Struct):
    name: str
    age: int


def test_struct_encodes_via_hook_and_decodes_typed():
    user = User("ada", 36)
    assert orjson_bytes(user, sort_keys=True) == b'{"age":36,"name":"ada"}'
    assert_parity(user)
    assert decode_as(msgspec_bytes(user), User) == user
    assert orjson.loads(orjson_bytes(user)) == {"name": "ada", "age": 36}


def test_decode_errors_share_value_error_base():
    for decode in (orjson.loads, msgspec.json.decode):
        with pytest.raises(ValueError):
            decode(b"{bad")
