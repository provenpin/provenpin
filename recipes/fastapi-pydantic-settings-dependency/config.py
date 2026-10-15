from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=False)

    app_name: str = "demo"
    debug: bool = False
    database_url: str = "sqlite:///:memory:"
    api_key: SecretStr  # required: no default, so a missing env var fails loudly


@lru_cache
def get_settings() -> Settings:
    # Built once per process. Env changes are invisible until cache_clear().
    return Settings()
