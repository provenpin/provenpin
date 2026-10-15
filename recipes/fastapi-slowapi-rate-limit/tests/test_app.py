import pytest
from fastapi.testclient import TestClient

from app import app, limiter

@pytest.fixture(autouse=True)
def fresh_limits():
    # the memory store is process-wide, so clear it before and after every test
    limiter.reset()
    limiter.enabled = True
    yield
    limiter.reset()
    limiter.enabled = True

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_allows_up_to_limit(client):
    assert [client.get("/ping").status_code for _ in range(3)] == [200, 200, 200]

def test_returns_429_over_limit(client):
    for _ in range(3):
        client.get("/ping")
    r = client.get("/ping")
    assert r.status_code == 429
    assert "Rate limit exceeded" in r.text

def test_keys_have_separate_buckets(client):
    # TestClient always comes from the same IP, so only the API key differs here
    for _ in range(2):
        assert client.get("/search", params={"q": "a"}, headers={"X-API-Key": "k1"}).status_code == 200
    assert client.get("/search", params={"q": "a"}, headers={"X-API-Key": "k1"}).status_code == 429
    assert client.get("/search", params={"q": "b"}, headers={"X-API-Key": "k2"}).status_code == 200

def test_reset_restores_budget(client):
    for _ in range(3):
        client.get("/ping")
    assert client.get("/ping").status_code == 429
    limiter.reset()
    assert client.get("/ping").status_code == 200

def test_disabled_limiter_bypasses_limits(client):
    limiter.enabled = False
    assert all(client.get("/ping").status_code == 200 for _ in range(10))
