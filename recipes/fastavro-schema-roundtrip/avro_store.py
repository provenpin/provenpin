import io
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Iterable

import fastavro

USER_SCHEMA: dict[str, Any] = {
    "type": "record",
    "name": "User",
    "namespace": "example",
    "fields": [
        {"name": "id", "type": "string"},
        {"name": "created", "type": {"type": "long", "logicalType": "timestamp-millis"}},
        {"name": "birthday", "type": {"type": "int", "logicalType": "date"}},
        {
            "name": "balance",
            "type": {"type": "bytes", "logicalType": "decimal", "precision": 10, "scale": 2},
        },
        {"name": "uid", "type": {"type": "string", "logicalType": "uuid"}},
    ],
}

READER_SCHEMA: dict[str, Any] = {
    "type": "record",
    "name": "User",
    "namespace": "example",
    "fields": [
        {"name": "id", "type": "string"},
        {
            "name": "created_at",
            "type": {"type": "long", "logicalType": "timestamp-millis"},
            "aliases": ["created"],
        },
        {
            "name": "balance",
            "type": {"type": "bytes", "logicalType": "decimal", "precision": 10, "scale": 2},
        },
        {"name": "uid", "type": {"type": "string", "logicalType": "uuid"}},
        {"name": "nickname", "type": "string", "default": "anon"},
        {"name": "tier", "type": "string", "default": "free"},
    ],
}

BAD_READER_SCHEMA: dict[str, Any] = {
    "type": "record",
    "name": "User",
    "namespace": "example",
    "fields": [
        {"name": "id", "type": "string"},
        {"name": "nickname", "type": "string"},
    ],
}

USER = fastavro.parse_schema(USER_SCHEMA)
READER = fastavro.parse_schema(READER_SCHEMA)
BAD_READER = fastavro.parse_schema(BAD_READER_SCHEMA)

SAMPLE: dict[str, Any] = {
    "id": "u-1",
    "created": datetime(2021, 2, 3, 4, 5, 6, tzinfo=timezone.utc),
    "birthday": date(1990, 5, 4),
    "balance": Decimal("10.50"),
    "uid": "12345678-1234-5678-1234-567812345678",
}

def write_container(records: Iterable[dict], schema: dict = USER, codec: str = "null") -> bytes:
    buf = io.BytesIO()
    fastavro.writer(buf, schema, list(records), codec=codec)
    return buf.getvalue()

def read_container(data: bytes, reader_schema: dict | None = None) -> list[dict]:
    return list(fastavro.reader(io.BytesIO(data), reader_schema=reader_schema))

def write_one(record: dict, schema: dict = USER) -> bytes:
    buf = io.BytesIO()
    fastavro.schemaless_writer(buf, schema, record)
    return buf.getvalue()

def read_one(data: bytes, schema: dict = USER) -> dict:
    return fastavro.schemaless_reader(io.BytesIO(data), schema)
