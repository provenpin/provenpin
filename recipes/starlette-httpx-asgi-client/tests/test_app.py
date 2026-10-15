import httpx
import pytest

from app import create_app


@pytest.fixture
async def app():
    application = create_app()
    async with application.router.lifespan_context(application):
        yield application


@pytest.fixture
async def client(app):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


async def test_route_returns_json(client):
    response = await client.get("/items/1")
    assert response.status_code == 200
    assert response.json() == {"id": 1, "name": "one"}


async def test_unknown_item_is_404(client):
    response = await client.get("/items/9")
    assert response.status_code == 404
    assert response.json() == {"detail": "not found"}


async def test_middleware_runs_outermost_first(app, client):
    app.state.trace.clear()
    await client.get("/items/1")
    assert app.state.trace == ["outer:in", "inner:in", "inner:out", "outer:out"]


async def test_transport_does_not_run_lifespan():
    bare = create_app()
    transport = httpx.ASGITransport(app=bare)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        with pytest.raises(AttributeError):
            await client.get("/items/1")
        async with bare.router.lifespan_context(bare):
            assert (await client.get("/items/1")).status_code == 200


async def test_unhandled_exception_propagates(client):
    with pytest.raises(ValueError):
        await client.get("/crash")


async def test_raise_app_exceptions_false_returns_500():
    app = create_app()
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/crash")
        assert response.status_code == 500
