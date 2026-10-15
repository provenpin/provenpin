import sqlite3

import httpx
import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport

from app import create_app, get_db


@pytest.fixture
async def client():
    # httpx's ASGITransport does not send lifespan events, so wrap the app
    app = create_app()
    async with LifespanManager(app) as manager:
        transport = ASGITransport(app=manager.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            yield c


async def test_create_then_read(client):
    created = await client.post("/notes", json={"body": "hello"})
    assert created.status_code == 201
    note_id = created.json()["id"]
    got = await client.get(f"/notes/{note_id}")
    assert got.json() == {"id": note_id, "body": "hello"}


async def test_missing_row_is_404(client):
    assert (await client.get("/notes/999")).status_code == 404


async def test_without_lifespan_state_is_missing():
    # No LifespanManager: app.state.db was never set, so the dependency fails
    app = create_app()
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        with pytest.raises(AttributeError):
            await c.get("/notes/1")


async def test_shutdown_closes_db():
    app = create_app()
    async with LifespanManager(app):
        db = app.state.db
    with pytest.raises(sqlite3.ProgrammingError):
        db.execute("SELECT 1")


async def test_each_app_gets_its_own_state():
    # Module-level app instances would share state across tests; factories do not
    async with LifespanManager(create_app()) as first, LifespanManager(create_app()) as second:
        async with httpx.AsyncClient(transport=ASGITransport(app=first.app), base_url="http://test") as c1:
            await c1.post("/notes", json={"body": "only in first"})
        async with httpx.AsyncClient(transport=ASGITransport(app=second.app), base_url="http://test") as c2:
            assert (await c2.get("/notes/1")).status_code == 404


async def test_dependency_override_skips_lifespan():
    app = create_app()
    db = sqlite3.connect(":memory:", check_same_thread=False)
    db.execute("CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT NOT NULL)")
    db.execute("INSERT INTO notes (body) VALUES ('fake')")
    app.dependency_overrides[get_db] = lambda: db
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.get("/notes/1")
    assert r.json()["body"] == "fake"
    db.close()
