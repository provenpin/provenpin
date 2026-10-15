import httpx
import pytest

from app import Todo, app, create_connection, get_conn, get_repo


@pytest.fixture(autouse=True)
def clean_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def make_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")


class FakeRepo:
    def __init__(self, todo: Todo | None):
        self.todo = todo

    def get(self, todo_id: int) -> Todo | None:
        return self.todo if self.todo and self.todo.id == todo_id else None


async def test_asgi_transport_skips_lifespan():
    async with make_client() as client:
        with pytest.raises(AttributeError):
            await client.get("/todos/1")


async def test_override_route_dependency():
    app.dependency_overrides[get_repo] = lambda: FakeRepo(Todo(id=1, title="mocked"))
    async with make_client() as client:
        r = await client.get("/todos/1")
    assert r.status_code == 200
    assert r.json() == {"id": 1, "title": "mocked"}


async def test_override_parent_propagates_to_child():
    app.dependency_overrides[get_conn] = create_connection
    async with make_client() as client:
        r = await client.get("/todos/1")
    assert r.json()["title"] == "write a recipe"


async def test_missing_todo_returns_404():
    app.dependency_overrides[get_repo] = lambda: FakeRepo(None)
    async with make_client() as client:
        r = await client.get("/todos/1")
    assert r.status_code == 404
    assert r.json()["detail"] == "todo not found"


async def test_generator_override_runs_teardown():
    events: list[str] = []

    def fake_repo():
        events.append("open")
        yield FakeRepo(Todo(id=1, title="yielded"))
        events.append("close")

    app.dependency_overrides[get_repo] = fake_repo
    async with make_client() as client:
        r = await client.get("/todos/1")
    assert r.json()["title"] == "yielded"
    assert events == ["open", "close"]


async def test_overrides_start_clean():
    assert app.dependency_overrides == {}
