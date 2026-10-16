import io

import pyarrow as pa
import pyarrow.parquet as pq


def to_parquet_bytes(table: pa.Table, compression: str = "zstd") -> bytes:
    sink = io.BytesIO()
    pq.write_table(table, sink, compression=compression)
    return sink.getvalue()


def from_parquet_bytes(data: bytes, schema: pa.Schema | None = None) -> pa.Table:
    return pq.read_table(pa.BufferReader(data), schema=schema)


def roundtrip(table: pa.Table, compression: str = "zstd") -> pa.Table:
    return from_parquet_bytes(to_parquet_bytes(table, compression))
