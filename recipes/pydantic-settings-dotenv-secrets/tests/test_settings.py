import os

import pytest
from pydantic import SecretStr, ValidationError

from settings import Settings

ENV = """\
# app config loaded from a dotenv file
APP_DEBUG=true
APP_DATABASE__HOST=db.internal
APP_DATABASE__PORT=6543
APP_DATABASE__USER=svc
APP_DATABASE__PASSWORD="p@ss word"
APP_CACHE__TTL=120
"""


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for key in list(os.environ):
        if key.startswith("APP_"):
            monkeypatch.delenv(key, raising=False)


@pytest.fixture
def env_file(tmp_path):
    path = tmp_path / ".env"
    path.write_text(ENV)
    return path


def load(env_file):
    return Settings(_env_file=env_file)


def test_loads_nested_values(env_file):
    s = load(env_file)
    assert s.debug is True
    assert s.database.host == "db.internal"
    assert s.database.port == 6543
    assert s.cache.ttl == 120


def test_secret_str_masks_but_keeps_value(env_file):
    s = load(env_file)
    assert isinstance(s.database.password, SecretStr)
    assert "p@ss word" not in repr(s)
    assert str(s.database.password) == "**********"
    assert s.database.password.get_secret_value() == "p@ss word"


def test_dumps_do_not_leak_secret(env_file):
    s = load(env_file)
    assert isinstance(s.model_dump()["database"]["password"], SecretStr)
    assert s.model_dump(mode="json")["database"]["password"] == "**********"


def test_env_var_overrides_dotenv(env_file, monkeypatch):
    monkeypatch.setenv("APP_DATABASE__HOST", "from-env")
    assert load(env_file).database.host == "from-env"


def test_missing_required_secret_raises(monkeypatch):
    monkeypatch.setenv("APP_DATABASE__USER", "svc")
    with pytest.raises(ValidationError) as exc:
        Settings(_env_file=None)
    assert "database" in str(exc.value)


def test_complex_values_need_json(monkeypatch):
    monkeypatch.setenv("APP_DATABASE__USER", "svc")
    monkeypatch.setenv("APP_DATABASE__PASSWORD", "y")
    monkeypatch.setenv("APP_ALLOWED_HOSTS", '["a.com","b.com"]')
    assert Settings(_env_file=None).allowed_hosts == ["a.com", "b.com"]
