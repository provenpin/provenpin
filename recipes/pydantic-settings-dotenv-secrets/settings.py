from pydantic import BaseModel, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Database(BaseModel):
    host: str = "localhost"
    port: int = 5432
    user: str
    password: SecretStr


class Cache(BaseModel):
    url: str = "redis://localhost:6379/0"
    ttl: int = 60


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_nested_delimiter="__",
        env_file=".env",
        extra="ignore",
    )

    debug: bool = False
    allowed_hosts: list[str] = []
    database: Database
    cache: Cache = Cache()
