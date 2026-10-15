import sqlite3

import pytest

from tasks import (
    add_task,
    add_tasks,
    archive_task,
    complete_task,
    create_schema,
    get_task,
    list_archived,
    list_tasks,
    make_db,
)


@pytest.fixture
async def db(tmp_path):
    database = make_db(f"sqlite+aiosqlite:///{tmp_path / 'tasks.db'}")
    await database.connect()
    await create_schema(database)
    yield database
    await database.disconnect()


async def test_insert_returns_id_update_returns_rowcount(db):
    assert await add_task(db, "write recipe") == 1
    assert await complete_task(db, "write recipe") == 1
    assert await complete_task(db, "never added") == 0


async def test_missing_row_is_none_and_record_is_a_mapping(db):
    assert await get_task(db, "nope") is None
    await add_task(db, "x")
    assert await get_task(db, "x") == {"id": 1, "title": "x", "done": 0}


async def test_named_bind_params_are_required(db):
    with pytest.raises(TypeError):
        await db.fetch_all("SELECT * FROM tasks WHERE title = ?", ("x",))


async def test_execute_many_bulk_inserts_and_returns_none(db):
    assert await add_tasks(db, ["a", "b", "c"]) is None
    assert [t["title"] for t in await list_tasks(db)] == ["a", "b", "c"]


async def test_schema_must_run_one_statement_at_a_time(db):
    with pytest.raises(sqlite3.ProgrammingError):
        await db.execute("CREATE TABLE a (id INTEGER); CREATE TABLE b (id INTEGER)")


async def test_transaction_commits_and_rolls_back(db):
    await add_task(db, "ship it")
    await archive_task(db, "ship it")
    assert await get_task(db, "ship it") is None
    assert "ship it" in await list_archived(db)

    await add_task(db, "ship it")
    with pytest.raises(sqlite3.IntegrityError):
        await archive_task(db, "ship it")
    assert await get_task(db, "ship it") is not None
