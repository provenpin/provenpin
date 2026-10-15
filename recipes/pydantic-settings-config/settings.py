from pydantic import BaseModel, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class DbSettings(BaseModel):
    url: str = "sqlite:///app.db"
    pool_size: int = Field(5, ge=1, le=50)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_", env_nested_delimiter="__", env_file=".env", extra="ignore")
    debug: bool = False
    api_key: SecretStr
    db: DbSettings = DbSettings()
