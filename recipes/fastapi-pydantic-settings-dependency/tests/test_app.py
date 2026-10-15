import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from config import Settings, get_settings
from main import app


@pytest.fixture(autouse=True)
def fresh_settings():
    get_settings.cache_clear()
    yield
    app.dependency_overrides.clear()
    get_settings.cache_clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_env_vars_fill_settings(monkeypatch, client):
    monkeypatch.setenv("API_KEY", "env-key")
    monkeypatch.setenv("APP_NAME", "from-env")
    monkeypatch.setenv("DEBUG", "true")
    assert client.get("/info").json() == {"app": "from-env", "debug": True}


def test_cache_pins_first_read(monkeypatch):
    monkeypatch.setenv("API_KEY", "first")
    first = get_settings()
    monkeypatch.setenv("API_KEY", "second")
    assert get_settings() is first
    assert get_settings().api_key.get_secret_value() == "first"
    get_settings.cache_clear()
    assert get_settings().api_key.get_secret_value() == "second"


def test_override_replaces_cached_dependency(client):
    # The override key must be the exact function object used in Depends().
    app.dependency_overrides[get_settings] = lambda: Settings(
        api_key="k", app_name="override", _env_file=None
    )
    assert client.get("/info").json()["app"] == "override"


def test_secure_uses_overridden_key(client):
    app.dependency_overrides[get_settings] = lambda: Settings(api_key="s3cret", _env_file=None)
    assert client.get("/secure", headers={"x-api-key": "s3cret"}).status_code == 200
    assert client.get("/secure", headers={"x-api-key": "nope"}).status_code == 401


def test_missing_required_key_fails(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)
