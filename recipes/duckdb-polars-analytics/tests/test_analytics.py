import duckdb
import polars as pl
import pytest
from polars.testing import assert_frame_equal

from analytics import revenue_by_region, revenue_by_region_polars, parquet_roundtrip

@pytest.fixture
def sales():
    return pl.DataFrame({
        "region": ["eu", "us", "eu", "apac", "us"],
        "amount": [10, 20, 30, 5, 15],
    })

@pytest.fixture
def con():
    with duckdb.connect() as c:
        yield c

def test_group_by_matches_polars(con, sales):
    got = revenue_by_region(con, sales).sort("region")
    want = revenue_by_region_polars(sales).sort("region")
    assert_frame_equal(got, want)  # checks dtypes too: BIGINT vs UInt32 would fail here

def test_nulls_aggregate_like_polars(con):
    df = pl.DataFrame({"region": ["eu", "eu", "us"], "amount": [10, None, None]})
    got = revenue_by_region(con, df).sort("region")
    want = revenue_by_region_polars(df).sort("region")
    assert_frame_equal(got, want)  # all-NULL group "us": COALESCE makes total 0 like polars

def test_parquet_roundtrip_preserves_frame(con, sales, tmp_path):
    got = parquet_roundtrip(con, sales, tmp_path / "sales.parquet")
    assert_frame_equal(got, sales)

def test_filter_pushdown_matches_polars(con, sales, tmp_path):
    path = tmp_path / "sales.parquet"
    sales.write_parquet(path)
    got = con.sql(
        "SELECT region, amount FROM read_parquet(?) WHERE amount > ? ORDER BY amount",
        params=[str(path), 10],
    ).pl()
    want = sales.filter(pl.col("amount") > 10).select("region", "amount").sort("amount")
    assert_frame_equal(got, want)

def test_replacement_scan_sees_local_frame(con, sales):
    # bare names resolve to Python locals in the calling frame (no register needed)
    assert con.sql("SELECT count(*) FROM sales").fetchone()[0] == 5
