from alembic import command
from alembic.config import Config
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, inspect
from models import Base

def cfg(url):
    c = Config()
    c.set_main_option("script_location", "migrations")
    c.set_main_option("sqlalchemy.url", url)
    return c

def test_upgrade_downgrade(tmp_path):
    url = f"sqlite:///{tmp_path}/db.sqlite"
    command.upgrade(cfg(url), "head")
    assert "account" in inspect(create_engine(url)).get_table_names()
    command.downgrade(cfg(url), "base")
    assert "account" not in inspect(create_engine(url)).get_table_names()

def test_models_match_migrations(tmp_path):
    url = f"sqlite:///{tmp_path}/db.sqlite"
    command.upgrade(cfg(url), "head")
    with create_engine(url).connect() as conn:
        diff = compare_metadata(MigrationContext.configure(conn), Base.metadata)
    assert diff == []
