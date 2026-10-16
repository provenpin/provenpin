from pydantic import BaseModel, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class HttpRetrySettings(BaseModel):
    attempts: int = 3
    backoff: float = 0.5


class HttpSettings(BaseModel):
    base_url: str = "https://api.example.com"
    timeout: float = 10.0
    retries: HttpRetrySettings = HttpRetrySettings()


class DbSettings(BaseModel):
    url: str = "sqlite:///app.db"
    pool_size: int = 5
    password: SecretStr = SecretStr("dev")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_nested_delimiter="__",
        case_sensitive=False,
        extra="ignore",
    )

    debug: bool = False
    features: list[str] = []
    http: HttpSettings = HttpSettings()
    db: DbSettings = DbSettings()


class AuthSettings(BaseModel):
    token: str


class ServiceSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SVC_", env_nested_delimiter="__")

    auth: AuthSettings
