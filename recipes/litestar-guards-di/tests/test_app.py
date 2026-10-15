import pytest
from litestar.di import Provide
from litestar.testing import create_test_client

from app import GUARDS, HANDLERS, ROUTES, ItemRepo


@pytest.fixture
def repo():
    return ItemRepo({1: "widget", 2: "gadget"})


@pytest.fixture
def client(repo):
    async def provide() -> ItemRepo:
        # the in-memory fake overrides the production provider
        return repo

    with create_test_client(
        route_handlers=ROUTES,
        dependencies={"repo": Provide(provide)},
        guards=GUARDS,
        exception_handlers=HANDLERS,
    ) as c:
        yield c


def test_get_returns_item_without_role(client):
    r = client.get("/items/1")
    assert r.status_code == 200
    assert r.json() == {"id": 1, "name": "widget"}


def test_missing_item_uses_exception_handler(client):
    r = client.get("/items/99")
    assert r.status_code == 404
    assert r.json() == {"error": "item not found", "id": 99}


def test_delete_without_credentials_is_401(client, repo):
    r = client.delete("/items/1")
    assert r.status_code == 401
    assert 1 in repo.items


def test_delete_with_wrong_role_is_403(client, repo):
    r = client.delete("/items/1", headers={"x-role": "user"})
    assert r.status_code == 403
    assert 1 in repo.items


def test_admin_delete_removes_item(client, repo):
    r = client.delete("/items/1", headers={"x-role": "admin"})
    assert r.status_code == 204
    assert 1 not in repo.items
