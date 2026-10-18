import io
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

import fastavro
import pytest
from fastavro.read import SchemaResolutionError

from avro_store import (
    BAD_READER,
    READER,
    SAMPLE,
    read_container,
    read_one,
    write_container,
    write_one,
)

def test_roundtrip_decodes_logical_types():
    (row,) = read_container(write_container([SAMPLE]))
    assert isinstance(row["created"], datetime) and row["created"].tzinfo is not None
    assert row["created"] == SAMPLE["created"]
    assert row["birthday"] == date(1990, 5, 4)
    assert row["balance"] == Decimal("10.50")
    assert row["uid"] == UUID(SAMPLE["uid"])

def test_deflate_codec_is_recorded_in_header():
    data = write_container([SAMPLE], codec="deflate")
    reader = fastavro.reader(io.BytesIO(data))
    assert reader.metadata["avro.codec"] == "deflate"
    assert [row["id"] for row in reader] == ["u-1"]

def test_reader_schema_renames_drops_and_defaults():
    (row,) = read_container(write_container([SAMPLE]), reader_schema=READER)
    assert row["created_at"] == SAMPLE["created"]
    assert row["nickname"] == "anon" and row["tier"] == "free"
    assert "birthday" not in row

def test_new_reader_field_without_default_raises():
    with pytest.raises(SchemaResolutionError):
        read_container(write_container([SAMPLE]), reader_schema=BAD_READER)

def test_schemaless_blob_needs_its_schema():
    raw = write_one(SAMPLE)
    assert raw[:4] != b"Obj\x01"
    with pytest.raises(ValueError):
        read_container(raw)
    assert read_one(raw)["id"] == "u-1"

def test_decimal_scale_beyond_schema_raises_but_shorter_is_padded():
    with pytest.raises(ValueError):
        write_container([dict(SAMPLE, balance=Decimal("10.555"))])
    (row,) = read_container(write_container([dict(SAMPLE, balance=Decimal("10.5"))]))
    assert row["balance"] == Decimal("10.50")
