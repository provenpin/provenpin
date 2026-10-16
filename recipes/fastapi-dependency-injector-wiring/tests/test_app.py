from __future__ import annotations

import httpx
import pytest
from dependency_injector import providers

from app import app, container
from container import TodoService


@pytest.fixture(autouse=True)
def reset_container():
    container.config.reset_override()
    container.config.from_dict({"limit": 2})
    yield
    container.config.reset_override()
    container.config.from_dict({"limit": 2})
    container.store.reset_override()
    container.service.reset_override()
    container.reset_singletons()


def make_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")


async def test_create_and_list_shares_singleton_store():
    async with make_client() as client:
        assert (await client.post("/todos", json={"title": "a"})).json() == {"id": 1}
        assert (await client.post("/todos", json={"title": "b"})).json() == {"id": 2}
        r = await client.get("/todos")
    assert r.json() == [{"id": 1, "title": "a"}, {"id": 2, "title": "b"}]


async def test_config_limit_returns_409():
    container.config.limit.override(1)
    async with make_client() as client:
        assert (await client.post("/todos", json={"title": "a"})).status_code == 200
        r = await client.post("/todos", json={"title": "b"})
    assert r.status_code == 409
    assert r.json()["detail"] == "todo limit reached"


async def test_override_store_propagates_to_service():
    class FakeStore:
        def items(self):
            return {7: "seeded"}

        def add(self, title):
            return 8

    container.store.override(providers.Singleton(FakeStore))
    async with make_client() as client:
        r = await client.get("/todos")
    assert r.json() == [{"id": 7, "title": "seeded"}]


async def test_override_service_then_reset():
    class FakeService:
        def create(self, title):
            return 42

        def listing(self):
            return [{"id": 42, "title": "mocked"}]

    container.service.override(providers.Factory(FakeService))
    async with make_client() as client:
        assert (await client.post("/todos", json={"title": "x"})).json() == {"id": 42}
    assert container.service.overridden
    container.service.reset_override()
    assert not container.service.overridden
    assert isinstance(container.service(), TodoService)


async def test_unwire_stops_injection():
    container.unwire()
    try:
        async with make_client() as client:
            with pytest.raises(AttributeError):
                await client.post("/todos", json={"title": "a"})
    finally:
        container.wire(modules=["app"])
