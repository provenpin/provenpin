from __future__ import annotations

from fastapi import FastAPI, HTTPException
from prometheus_client import CollectorRegistry
from prometheus_fastapi_instrumentator import Instrumentator


def create_app(
    registry: CollectorRegistry | None = None,
    excluded_handlers: list[str] | None = None,
) -> FastAPI:
    app = FastAPI()

    @app.get("/items/{item_id}")
    def read_item(item_id: int) -> dict[str, int]:
        return {"item_id": item_id}

    @app.get("/boom")
    def boom() -> None:
        raise HTTPException(status_code=500, detail="boom")

    # Pass an explicit registry per app: `Instrumentator` silently drops all
    # metrics when its metric names already exist in the target registry.
    Instrumentator(
        registry=registry,
        excluded_handlers=excluded_handlers or [],
    ).instrument(app).expose(app)
    return app


app = create_app()
