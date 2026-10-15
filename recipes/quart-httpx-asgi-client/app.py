from __future__ import annotations

import httpx
from quart import Quart, abort, request

UPSTREAM_URL = "https://rates.example.com"


def create_app(upstream: httpx.AsyncClient | None = None) -> Quart:
    app = Quart(__name__)
    app.extensions["upstream"] = upstream

    # These lifecycle hooks only run when a real server drives the ASGI lifespan,
    # which httpx.ASGITransport does not do. Inject `upstream` in tests instead.
    @app.before_serving
    async def open_upstream() -> None:
        if app.extensions["upstream"] is None:
            app.extensions["upstream"] = httpx.AsyncClient(base_url=UPSTREAM_URL)

    @app.after_serving
    async def close_upstream() -> None:
        client = app.extensions["upstream"]
        if client is not None:
            await client.aclose()

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/echo")
    async def echo() -> dict[str, object]:
        # Quart request bodies are async, unlike Flask's synchronous request.json.
        payload = await request.get_json()
        return {"received": payload}

    @app.get("/convert")
    async def convert() -> dict[str, object]:
        try:
            amount = float(request.args.get("amount", "1"))
        except ValueError:
            abort(400, "amount must be numeric")
        currency = request.args.get("to", "EUR").upper()
        client = app.extensions["upstream"]
        if client is None:
            abort(503, "upstream client not started")
        response = await client.get("/latest", params={"base": "USD"})
        response.raise_for_status()
        rate = response.json()["rates"][currency]
        return {"amount": amount, "currency": currency, "converted": amount * rate}

    @app.get("/boom")
    async def boom() -> dict[str, str]:
        raise RuntimeError("deliberate failure")

    return app
