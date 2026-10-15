from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field, SecretStr
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)

class DbSettings(BaseModel):
    url: str = "sqlite:///app.db"
    password: SecretStr = SecretStr("")

class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="APP_", env_nested_delimiter="__", extra="ignore",
    )
    debug: bool = False
    api_key: SecretStr = SecretStr("dev-key")
    # default_factory avoids sharing one mutable default instance across objects
    db: DbSettings = Field(default_factory=DbSettings)

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls,
        init_settings,
        env_settings,
        dotenv_settings,
        file_secret_settings,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        # first source wins: init > env > yaml > field defaults
        return (init_settings, env_settings, YamlConfigSettingsSource(settings_cls))

def load_settings(yaml_file: Path | None = None, **init: Any) -> AppSettings:
    # a subclass per call lets each test point the YAML source at its own file
    cls = type(
        "LoadedSettings",
        (AppSettings,),
        {"model_config": AppSettings.model_config | {"yaml_file": yaml_file}},
    )
    return cls(**init)
