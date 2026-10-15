import pytest
from sqlalchemy import create_engine, inspect, text
from alembic.autogenerate import compare_metadata
from alembic.runtime.migration import MigrationContext

from models import Base

@pytest.fixture
def engine():
    # A fresh in-memory SQLite database per test keeps tests isolated and offline.
    eng = create_engine("sqlite://")
    yield eng
    eng.dispose()

def flatten(ops):
    # compare_metadata nests column-level diffs (modify_type, modify_nullable, ...)
    # in a list, while table/index/column add/remove ops are bare tuples.
    for op in ops:
        if isinstance(op, list):
            yield from flatten(op)
        else:
            yield op

def drift(engine):
    # Alembic diffs use a live connection; the in-memory DB only exists on that connection.
    with engine.connect() as conn:
        ctx = MigrationContext.configure(conn, opts={"compare_type": True})
        return list(flatten(compare_metadata(ctx, Base.metadata)))

def test_clean_schema_has_no_drift(engine):
    Base.metadata.create_all(engine)
    assert drift(engine) == []

def test_naming_convention_names_fk_constraint(engine):
    # Unnamed FKs would reflect as None here, which breaks later migrations.
    Base.metadata.create_all(engine)
    fks = inspect(engine).get_foreign_keys("post")
    assert fks[0]["name"] == "fk_post_user_id_user"

def test_extra_db_column_is_remove_column(engine):
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE user ADD COLUMN age INTEGER"))
    ops = drift(engine)
    assert any(op[0] == "remove_column" and op[3].name == "age" for op in ops)

def test_type_change_is_detected(engine):
    # Model says String(255); the DB column is VARCHAR(50). SQLite cannot ALTER
    # types, so the drifted table is created by hand.
    with engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE user (id INTEGER NOT NULL PRIMARY KEY, "
            "email VARCHAR(50) NOT NULL UNIQUE, name VARCHAR(100))"
        ))
        Base.metadata.tables["post"].create(conn)
    ops = drift(engine)
    assert any(op[0] == "modify_type" and op[2] == "user" and op[3] == "email" for op in ops)

def test_dropped_index_is_add_index(engine):
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        conn.execute(text("DROP INDEX ix_post_user_id"))
    ops = drift(engine)
    assert any(op[0] == "add_index" and op[1].name == "ix_post_user_id" for op in ops)

def test_unmodeled_table_is_remove_table(engine):
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE legacy (id INTEGER PRIMARY KEY)"))
    ops = drift(engine)
    assert any(op[0] == "remove_table" and op[1].name == "legacy" for op in ops)
