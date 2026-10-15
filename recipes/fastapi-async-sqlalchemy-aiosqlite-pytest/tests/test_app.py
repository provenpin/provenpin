import httpx
import pytest_asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app import Base, app, get_session


@pytest_asyncio.fixture
async def client():
    # A fresh in-memory database per test. StaticPool forces a single shared
    # connection, because each new sqlite :memory: connection is its own empty DB.
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_session():
        async with maker() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    # ASGITransport does not run the app lifespan, so do not rely on startup hooks.
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
    await engine.dispose()


async def test_create_and_fetch(client):
    r = await client.post("/items", json={"name": "pen", "price_cents": 150})
    assert r.status_code == 201
    item_id = r.json()["id"]

    r = await client.get(f"/items/{item_id}")
    assert r.json() == {"id": item_id, "name": "pen", "price_cents": 150}


async def test_missing_item_is_404(client):
    r = await client.get("/items/999")
    assert r.status_code == 404


async def test_invalid_payload_is_422(client):
    r = await client.post("/items", json={"name": "pen", "price_cents": "lots"})
    assert r.status_code == 422


async def test_each_test_gets_fresh_db(client):
    # With a fresh database per test, the first insert always gets id 1.
    r = await client.post("/items", json={"name": "cup", "price_cents": 900})
    assert r.json()["id"] == 1
