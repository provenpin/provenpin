import os

import pytest
from dotenv import dotenv_values, load_dotenv
from pydantic import ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict

from settings import AppSettings


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for key in [k for k in os.environ if k.startswith("APP_")]:
        monkeypatch.delenv(key)
    yield
    # load_dotenv writes to os.environ directly, which monkeypatch does not undo
    for key in [k for k in os.environ if k.startswith("APP_")]:
        os.environ.pop(key)


def write(tmp_path, name, text):
    path = tmp_path / name
    path.write_text(text)
    return path


def test_precedence_kwargs_over_env_over_dotenv(tmp_path, monkeypatch):
    env = write(tmp_path, ".env", "APP_DEBUG=false\n")
    assert AppSettings(_env_file=env).debug is False

    monkeypatch.setenv("APP_DEBUG", "true")  # real env var beats the file
    assert AppSettings(_env_file=env).debug is True

    assert AppSettings(_env_file=env, debug=False).debug is False  # init kwargs beat all


def test_later_env_file_wins(tmp_path):
    base = write(tmp_path, "base.env", "APP_WORKERS=2\nAPP_DATABASE_URL=sqlite:///base.db\n")
    local = write(tmp_path, "local.env", "APP_WORKERS=8\n")
    s = AppSettings(_env_file=(base, local))
    assert s.workers == 8
    assert s.database_url == "sqlite:///base.db"


def test_invalid_value_raises(tmp_path):
    env = write(tmp_path, ".env", "APP_WORKERS=0\n")
    with pytest.raises(ValidationError):
        AppSettings(_env_file=env)


class Strict(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_", extra="forbid")
    debug: bool = False


def test_typo_key_rejected_when_extra_forbidden(tmp_path):
    env = write(tmp_path, ".env", "APP_DEGUB=true\n")
    with pytest.raises(ValidationError):
        Strict(_env_file=env)


def test_load_dotenv_does_not_override_existing_env(tmp_path, monkeypatch):
    env = write(tmp_path, ".env", "APP_DEBUG=false\nAPP_NEW=1\n")
    monkeypatch.setenv("APP_DEBUG", "true")
    load_dotenv(env)  # override=False by default
    assert os.environ["APP_DEBUG"] == "true"
    assert os.environ["APP_NEW"] == "1"
    assert dotenv_values(env)["APP_DEBUG"] == "false"  # parsed, not exported
