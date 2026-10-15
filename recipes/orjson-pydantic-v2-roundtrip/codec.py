from decimal import Decimal
from enum import Enum
from typing import Any

import orjson
from pydantic import BaseModel, SecretStr, TypeAdapter


def _default(obj: Any) -> Any:
    if isinstance(obj, BaseModel):
        return obj.model_dump()
    if isinstance(obj, Decimal):
        return str(obj)
    if isinstance(obj, SecretStr):
        return str(obj)
    if isinstance(obj, Enum):
        return obj.value
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def dumps(model: Any, *, sort_keys: bool = False, utc_z: bool = False) -> bytes:
    option = orjson.OPT_NON_STR_KEYS
    if sort_keys:
        option |= orjson.OPT_SORT_KEYS
    if utc_z:
        option |= orjson.OPT_NAIVE_UTC | orjson.OPT_UTC_Z
    return orjson.dumps(model, default=_default, option=option)


def loads(data: bytes | str, model_type: type[BaseModel]) -> BaseModel:
    return TypeAdapter(model_type).validate_python(orjson.loads(data))
