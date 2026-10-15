import aiohttp
import pytest

from app import make_app


async def test_health(aiohttp_client):
    client = await aiohttp_client(make_app())
    resp = await client.get("/health")
    assert resp.status == 200
    assert resp.content_type == "application/json"
    assert await resp.json() == {"status": "ok"}


async def test_missing_user_raises(aiohttp_client):
    client = await aiohttp_client(make_app())
    resp = await client.get("/users/99")
    assert resp.status == 404
    with pytest.raises(aiohttp.ClientResponseError) as exc:
        resp.raise_for_status()
    assert exc.value.status == 404


async def test_create_then_fetch(aiohttp_client):
    client = await aiohttp_client(make_app())
    created = await client.post("/users", json={"name": "Grace"})
    assert created.status == 201
    body = await created.json()
    assert body["name"] == "Grace"
    fetched = await client.get(f"/users/{body['id']}")
    assert await fetched.json() == body


async def test_invalid_payload_is_400(aiohttp_client):
    client = await aiohttp_client(make_app())
    resp = await client.post("/users", json={})
    assert resp.status == 400
    assert await resp.text() == "name is required"


async def test_fresh_app_isolates_state(aiohttp_client):
    first = await aiohttp_client(make_app())
    second = await aiohttp_client(make_app())
    await first.post("/users", json={"name": "Grace"})
    resp = await second.get("/users/3")
    assert resp.status == 404
