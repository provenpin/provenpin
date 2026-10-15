import pytest
from peewee import IntegrityError, OperationalError, SqliteDatabase

from migrations import add_profile_columns, run_broken_plan
from models import Note, User

LEGACY_USER = (
    "CREATE TABLE user ("
    "id INTEGER PRIMARY KEY, "
    "username VARCHAR(255) NOT NULL UNIQUE)"
)


def columns(database, table="user"):
    return {column.name for column in database.get_columns(table)}


@pytest.fixture
def database(tmp_path):
    database = SqliteDatabase(str(tmp_path / "app.db"), pragmas={"foreign_keys": 1})
    with database.bind_ctx([User, Note]):
        database.execute_sql(LEGACY_USER)
        yield database
        database.close()


@pytest.fixture
def migrated(database):
    add_profile_columns(database)
    database.create_tables([Note])
    return database


def test_add_column_backfills_existing_rows(database):
    database.execute_sql("INSERT INTO user (username) VALUES ('ada')")
    add_profile_columns(database)
    assert {"email", "karma"} <= columns(database)
    row = User.get(User.username == "ada")
    assert row.email == "" and row.karma == 0


def test_migrate_is_not_transactional(database):
    with pytest.raises(OperationalError):
        run_broken_plan(database, transactional=False)
    assert "nickname" in columns(database)


def test_migration_context_rolls_back_failed_migration(database):
    with pytest.raises(OperationalError):
        run_broken_plan(database, transactional=True)
    assert "nickname" not in columns(database)


def test_nested_atomic_uses_savepoints(migrated):
    User.create(username="kept")
    with pytest.raises(RuntimeError):
        with migrated.atomic():
            User.create(username="outer")
            with migrated.atomic() as savepoint:
                User.create(username="inner")
                savepoint.rollback()
            User.create(username="after")
            raise RuntimeError("boom")
    assert sorted(user.username for user in User.select()) == ["kept"]


def test_foreign_key_pragma_blocks_orphaned_children(migrated):
    user = User.create(username="ada")
    Note.create(user=user, body="hello")
    with pytest.raises(IntegrityError):
        user.delete_instance()
    assert Note.select().count() == 1
