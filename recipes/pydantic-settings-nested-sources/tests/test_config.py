import os

import pytest
from pydantic import ValidationError

from config import HttpRetrySettings, HttpSettings, ServiceSettings, Settings


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for key in list(os.environ):
        if key.upper().startswith(("APP_", "SVC_")):
            monkeypatch.delenv(key)


def test_defaults_are_nested_instances():
    s = Settings()
    assert isinstance(s.http, HttpSettings)
    assert s.http.retries.attempts == 3
    assert s.db.password.get_secret_value() == "dev"


def test_nested_env_overrides(monkeypatch):
    monkeypatch.setenv("app_db__url", "sqlite:///prod.db")
    monkeypatch.setenv("APP_DB__POOL_SIZE", "20")
    monkeypatch.setenv("APP_DEBUG", "on")
    s = Settings()
    assert s.db.url == "sqlite:///prod.db"
    assert s.db.pool_size == 20
    assert s.debug is True


def test_partial_nested_override_keeps_sibling_defaults(monkeypatch):
    monkeypatch.setenv("APP_HTTP__TIMEOUT", "2.5")
    s = Settings()
    assert s.http.timeout == 2.5
    assert s.http.base_url == "https://api.example.com"
    assert s.http.retries.attempts == 3


def test_deep_nested_delimiter(monkeypatch):
    monkeypatch.setenv("APP_HTTP__RETRIES__ATTEMPTS", "9")
    monkeypatch.setenv("APP_HTTP__RETRIES__BACKOFF", "1.5")
    s = Settings()
    assert isinstance(s.http.retries, HttpRetrySettings)
    assert s.http.retries.attempts == 9
    assert s.http.retries.backoff == 1.5


def test_complex_field_decoded_from_json(monkeypatch):
    monkeypatch.setenv("APP_FEATURES", '["beta", "dark-mode"]')
    s = Settings()
    assert s.features == ["beta", "dark-mode"]


def test_required_nested_model_is_built_from_env(monkeypatch):
    with pytest.raises(ValidationError):
        ServiceSettings()
    monkeypatch.setenv("SVC_AUTH__TOKEN", "s3cr3t")
    assert ServiceSettings().auth.token == "s3cr3t"
