import pytest
from pydantic import ValidationError
from settings import Settings

def test_env_and_nested(monkeypatch):
    monkeypatch.setenv("APP_API_KEY", "s3cret")
    monkeypatch.setenv("APP_DEBUG", "true")
    monkeypatch.setenv("APP_DB__POOL_SIZE", "10")
    s = Settings(_env_file=None)
    assert s.debug is True and s.db.pool_size == 10
    assert s.api_key.get_secret_value() == "s3cret" and "s3cret" not in repr(s)

def test_dotenv(tmp_path, monkeypatch):
    monkeypatch.delenv("APP_API_KEY", raising=False)
    env = tmp_path / ".env"
    env.write_text("APP_API_KEY=fromfile\n")
    assert Settings(_env_file=env).api_key.get_secret_value() == "fromfile"

def test_validation(monkeypatch):
    monkeypatch.setenv("APP_API_KEY", "x")
    monkeypatch.setenv("APP_DB__POOL_SIZE", "500")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)
