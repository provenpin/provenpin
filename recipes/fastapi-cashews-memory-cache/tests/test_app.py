import httpx
import pytest
from httpx import ASGITransport

import app as app_module
from cashews import cache


@pytest.fixture(autouse=True)
async def fresh_state():
    cache.setup("mem://")
    app_module.store.reset()
    yield
    await cache.clear()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app_module.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


async def test_get_is_cached(client):
    first = await client.get("/items/1")
    second = await client.get("/items/1")
    assert first.status_code == second.status_code == 200
    assert first.json() == {"id": 1, "name": "widget", "stock": 3}
    assert app_module.store.loads == 1


async def test_key_tracks_path_param(client):
    await client.get("/items/1")
    await client.get("/items/2")
    assert app_module.store.loads == 2


async def test_update_invalidates_entry(client):
    assert (await client.get("/items/1")).json()["stock"] == 3
    updated = await client.put("/items/1", params={"stock": 10})
    assert updated.json()["stock"] == 10
    assert (await client.get("/items/1")).json()["stock"] == 10
    assert app_module.store.loads == 2


async def test_missing_item_is_not_cached(client):
    assert (await client.get("/items/99")).status_code == 404
    assert (await client.get("/items/99")).status_code == 404
    assert app_module.store.loads == 2


async def test_ttl_is_exposed(client):
    await client.get("/items/1")
    ttl = await cache.get_expire("item:1")
    assert 0 < ttl <= 300


async def test_cache_control_header(client):
    await client.get("/items/1")
    hit = await client.get("/items/1")
    assert hit.headers["cache-control"].startswith("private, max-age=")
    assert int(hit.headers["age"]) > 0
