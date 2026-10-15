from __future__ import annotations

from fastapi import FastAPI, Request, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    generate_latest,
)


def create_app(registry: CollectorRegistry | None = None) -> FastAPI:
    registry = registry or CollectorRegistry()
    requests = Counter(
        "http_requests",
        "HTTP requests handled",
        ["method", "path", "status"],
        registry=registry,
    )
    app = FastAPI()

    @app.middleware("http")
    async def count_requests(request: Request, call_next):
        response = await call_next(request)
        # Skip scraping so /metrics does not count itself, and label by the
        # matched route template, not the raw path, to bound cardinality.
        if request.url.path != "/metrics":
            route = request.scope.get("route")
            path = getattr(route, "path", request.url.path)
            requests.labels(request.method, path, response.status_code).inc()
        return response

    @app.get("/metrics")
    def metrics() -> Response:
        return Response(generate_latest(registry), media_type=CONTENT_TYPE_LATEST)

    @app.get("/items/{item_id}")
    def read_item(item_id: int) -> dict[str, int]:
        return {"item_id": item_id}

    return app


app = create_app()
