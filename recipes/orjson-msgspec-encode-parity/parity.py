from __future__ import annotations

from typing import Any

import msgspec
import orjson


def _hook(obj: Any) -> Any:
    if isinstance(obj, msgspec.Struct):
        return msgspec.to_builtins(obj)
    raise TypeError(f"orjson cannot encode {type(obj).__name__}")


def orjson_bytes(obj: Any, *, sort_keys: bool = False) -> bytes:
    option = orjson.OPT_NON_STR_KEYS | (orjson.OPT_SORT_KEYS if sort_keys else 0)
    return orjson.dumps(obj, default=_hook, option=option)


def msgspec_bytes(obj: Any, *, sort_keys: bool = False) -> bytes:
    return msgspec.json.encode(obj, order="sorted" if sort_keys else None)


def encode_both(obj: Any) -> tuple[bytes, bytes]:
    return orjson_bytes(obj, sort_keys=True), msgspec_bytes(obj, sort_keys=True)


def assert_parity(obj: Any) -> None:
    o, m = encode_both(obj)
    if o != m:
        raise AssertionError(f"orjson={o!r} msgspec={m!r}")


def decode_as(payload: bytes, type_: Any) -> Any:
    return msgspec.json.decode(payload, type=type_)
