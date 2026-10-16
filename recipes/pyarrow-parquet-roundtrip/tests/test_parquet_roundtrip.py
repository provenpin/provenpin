import pyarrow as pa
import pyarrow.parquet as pq

from parquet_roundtrip import from_parquet_bytes, roundtrip, to_parquet_bytes


def test_roundtrip_preserves_values_and_schema():
    table = pa.table({
        "id": pa.array([1, 2, 3], type=pa.int64()),
        "name": pa.array(["a", "b", "c"], type=pa.string()),
        "score": pa.array([1.5, None, 3.25], type=pa.float64()),
    })
    result = roundtrip(table)
    assert result.schema == table.schema
    assert result.to_pydict() == table.to_pydict()


def test_null_count_and_types_survive():
    table = pa.table({"v": pa.array([1, None, 3], type=pa.int32())})
    result = roundtrip(table)
    assert result.schema.field("v").type == pa.int32()
    assert result.column("v").null_count == 1
    assert result.column("v").to_pylist() == [1, None, 3]


def test_compression_codec_is_recorded():
    table = pa.table({"n": list(range(5000))})
    compressed = to_parquet_bytes(table, compression="zstd")
    raw = to_parquet_bytes(table, compression="none")
    assert len(compressed) < len(raw)
    meta = pq.ParquetFile(pa.BufferReader(compressed)).metadata
    assert meta.row_group(0).column(0).compression == "ZSTD"


def test_schema_metadata_is_preserved():
    table = pa.table({"x": [1]}).replace_schema_metadata({"unit": "meters"})
    result = roundtrip(table)
    assert result.schema.metadata == {b"unit": b"meters"}


def test_explicit_schema_casts_on_read():
    data = to_parquet_bytes(pa.table({"id": pa.array([1, 2], type=pa.int64())}))
    target = pa.schema([pa.field("id", pa.int32())])
    result = from_parquet_bytes(data, schema=target)
    assert result.schema.field("id").type == pa.int32()
    assert result.column("id").to_pylist() == [1, 2]


def test_timestamp_timezone_roundtrip():
    stamps = pa.array([0, 86400], type=pa.timestamp("us", tz="UTC"))
    result = roundtrip(pa.table({"at": stamps}))
    assert result.schema.field("at").type == pa.timestamp("us", tz="UTC")
    assert result.column("at").cast(pa.int64()).to_pylist() == [0, 86400]
