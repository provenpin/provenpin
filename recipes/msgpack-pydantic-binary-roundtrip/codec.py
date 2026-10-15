from datetime import datetime
from decimal import Decimal
from uuid import UUID

import msgpack
from pydantic import BaseModel


class Item(BaseModel):
    sku: str
    qty: int
    price: Decimal


class Order(BaseModel):
    id: UUID
    placed_at: datetime
    items: list[Item]
    attrs: dict[int, str] = {}


def pack_model(model: BaseModel) -> bytes:
    # mode="json" turns Decimal/UUID/datetime into msgpack-friendly scalars
    return msgpack.packb(model.model_dump(mode="json"), use_bin_type=True)


def unpack_model(cls: type[BaseModel], data: bytes) -> BaseModel:
    return cls.model_validate(
        msgpack.unpackb(data, raw=False, strict_map_key=True)
    )
