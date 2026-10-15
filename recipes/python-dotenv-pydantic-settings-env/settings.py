from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# Source priority (highest first): init kwargs, real env vars, env_file(s), defaults.
class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_", extra="ignore")

    database_url: str = "sqlite:///:memory:"
    debug: bool = False
    api_key: SecretStr | None = None
    workers: int = Field(default=1, ge=1)
