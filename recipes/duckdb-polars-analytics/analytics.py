from pathlib import Path

import duckdb
import polars as pl

def revenue_by_region(con: duckdb.DuckDBPyConnection, df: pl.DataFrame) -> pl.DataFrame:
    # register() is explicit; a bare table name only resolves via replacement scan in the caller's frame
    con.register("sales", df)
    return con.sql("""
        SELECT region,
               CAST(COALESCE(SUM(amount), 0) AS BIGINT) AS total,  -- SQL SUM of all NULLs is NULL; polars gives 0
               AVG(amount) AS avg_amount,
               COUNT(*) AS n                                       -- BIGINT in DuckDB
        FROM sales
        GROUP BY region
    """).pl()

def revenue_by_region_polars(df: pl.DataFrame) -> pl.DataFrame:
    return df.group_by("region").agg(
        pl.col("amount").sum().alias("total"),
        pl.col("amount").mean().alias("avg_amount"),
        pl.len().cast(pl.Int64).alias("n"),  # pl.len() is UInt32, cast to match DuckDB
    )

def parquet_roundtrip(con: duckdb.DuckDBPyConnection, df: pl.DataFrame, path: Path) -> pl.DataFrame:
    df.write_parquet(path)
    # pass the path as a bound parameter, not an f-string; convert Path to str
    return con.sql("SELECT * FROM read_parquet(?)", params=[str(path)]).pl()
