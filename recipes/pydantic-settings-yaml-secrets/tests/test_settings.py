import os

import pytest

from settings import load_settings

@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    # stop APP_* variables from the developer's shell leaking into tests
    for key in list(os.environ):
        if key.startswith("APP_"):
            monkeypatch.delenv(key)

@pytest.fixture
def yaml_file(tmp_path):
    p = tmp_path / "config.yaml"
    p.write_text(
        "debug: true\n"
        "api_key: yaml-key\n"
        "db:\n"
        "  url: postgresql://yaml/db\n"
        "  password: yaml-pass\n"
    )
    return p

def test_defaults_when_nothing_set():
    s = load_settings()
    assert s.debug is False
    assert s.db.url == "sqlite:///app.db"

def test_yaml_overrides_defaults(yaml_file):
    s = load_settings(yaml_file)
    assert s.debug is True
    assert s.db.url == "postgresql://yaml/db"

def test_env_beats_yaml_and_merges_nested(yaml_file, monkeypatch):
    monkeypatch.setenv("APP_DB__URL", "sqlite:///env.db")
    s = load_settings(yaml_file)
    assert s.db.url == "sqlite:///env.db"
    # sibling nested key from yaml survives: sources are deep-merged
    assert s.db.password.get_secret_value() == "yaml-pass"

def test_init_beats_env(yaml_file, monkeypatch):
    monkeypatch.setenv("APP_DEBUG", "true")
    s = load_settings(yaml_file, debug=False)
    assert s.debug is False

def test_secrets_are_masked(yaml_file):
    s = load_settings(yaml_file)
    assert s.api_key.get_secret_value() == "yaml-key"
    assert "yaml-pass" not in repr(s)
    assert "yaml-pass" not in str(s.model_dump(mode="json"))
