import pandas as pd
import pyarrow as pa
import pyarrow.dataset as ds
import pyarrow.parquet as pq

# Explicit schema: enforced on write, and reused on read so partition keys keep their type.
SCHEMA = pa.schema([
    ("id", pa.int64()),
    ("score", pa.int64()),  # nullable
    ("name", pa.string()),
    ("year", pa.int16()),   # partition column
])

def write_partitioned(df: pd.DataFrame, root) -> None:
    # Conversion to Arrow fails here, before any file is written, if the data does not match SCHEMA.
    table = pa.Table.from_pandas(df, schema=SCHEMA, preserve_index=False)
    pq.write_to_dataset(table, root_path=str(root), partition_cols=["year"])

def read_partitioned(root) -> pd.DataFrame:
    # Hive partitioning with an explicit type avoids the default dictionary-encoded partition column.
    part = ds.partitioning(pa.schema([("year", pa.int16())]), flavor="hive")
    table = ds.dataset(str(root), format="parquet", partitioning=part, schema=SCHEMA).to_table()
    return table.to_pandas(types_mapper=pd.ArrowDtype)
