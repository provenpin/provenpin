import pandas as pd
import sqlalchemy as sa
from sqlalchemy.pool import StaticPool

def make_engine(url: str = "sqlite://") -> sa.Engine:
    # StaticPool keeps one shared connection, so every session sees the same in-memory DB
    return sa.create_engine(url, poolclass=StaticPool)

def save_frame(df: pd.DataFrame, engine: sa.Engine, table: str,
               dtype: dict | None = None, if_exists: str = "replace") -> int | None:
    # index=False: pandas defaults to index=True and would add an "index" column
    # engine.begin() commits on exit; engine.connect() alone would roll back
    with engine.begin() as conn:
        return df.to_sql(table, conn, index=False, dtype=dtype, if_exists=if_exists)

def load_frame(engine: sa.Engine, query: str, **kwargs) -> pd.DataFrame:
    # SQLAlchemy 2 requires text() for raw SQL strings; bind params via params=, never f-strings
    with engine.connect() as conn:
        return pd.read_sql(sa.text(query), conn, **kwargs)
