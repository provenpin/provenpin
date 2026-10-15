from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException

from config import Settings, get_settings

app = FastAPI()

SettingsDep = Annotated[Settings, Depends(get_settings)]


@app.get("/info")
def info(settings: SettingsDep):
    return {"app": settings.app_name, "debug": settings.debug}


@app.get("/secure")
def secure(settings: SettingsDep, x_api_key: Annotated[str | None, Header()] = None):
    if x_api_key != settings.api_key.get_secret_value():
        raise HTTPException(status_code=401, detail="bad key")
    return {"ok": True}
