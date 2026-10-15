import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import pytest

from parquet_pipeline import read_partitioned, write_partitioned

def make_df() -> pd.DataFrame:
    return pd.DataFrame({
        "id": pd.array([1, 2, 3, 4], dtype="int64[pyarrow]"),
        "score": pd.array([10, None, 30, None], dtype="int64[pyarrow]"),
        "name": pd.array(["a", None, "c", "d"], dtype=pd.ArrowDtype(pa.string())),
        "year": pd.array([2023, 2023, 2024, 2024], dtype="int16[pyarrow]"),
    })

def test_nullable_ints_survive_single_file(tmp_path):
    # Contrast: numpy int64 with a None silently becomes float64.
    assert pd.Series([10, None, 30]).dtype == "float64"

    path = tmp_path / "single.parquet"
    make_df().drop(columns="year").to_parquet(path, engine="pyarrow", index=False)
    out = pd.read_parquet(path, dtype_backend="pyarrow")

    assert str(out["score"].dtype) == "int64[pyarrow]"
    assert pd.isna(out["score"].iloc[1])
    assert out["score"].iloc[2] == 30

def test_schema_rejects_bad_data_before_writing(tmp_path):
    bad = make_df().astype({"score": object})
    bad.loc[0, "score"] = "not-a-number"

    root = tmp_path / "ds"
    with pytest.raises((pa.ArrowInvalid, pa.ArrowTypeError)):
        write_partitioned(bad, root)
    assert not root.exists() or not any(root.iterdir())

def test_partitioned_roundtrip_keeps_types(tmp_path):
    root = tmp_path / "ds"
    write_partitioned(make_df(), root)

    assert (root / "year=2023").is_dir() and (root / "year=2024").is_dir()
    out = read_partitioned(root).sort_values("id").reset_index(drop=True)
    pd.testing.assert_frame_equal(out, make_df())

def test_default_hive_read_gives_dictionary_partition(tmp_path):
    # Gotcha: without an explicit partitioning schema, partition keys come back dictionary-encoded.
    root = tmp_path / "ds"
    write_partitioned(make_df(), root)

    table = pq.read_table(str(root))
    assert pa.types.is_dictionary(table.schema.field("year").type)
