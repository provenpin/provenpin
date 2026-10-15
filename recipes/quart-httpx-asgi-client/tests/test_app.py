import httpx
import pytest

from app import create_app


def asgi(app, **transport_kwargs) -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app, **transport_kwargs)
    return httpx.AsyncClient(transport=transport, base_url="http://testserver")


def fake_upstream(rates: dict[str, float], status_code: int = 200) -> httpx.AsyncClient:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code, json={"base": "USD", "rates": rates})

    return httpx.AsyncClient(
        transport=httpx.MockTransport(handler), base_url="https://rates.example.com"
    )


@pytest.mark.anyio
async def test_health_roundtrip():
    async with asgi(create_app()) as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_json_body_is_awaited():
    async with asgi(create_app()) as client:
        response = await client.post("/echo", json={"numbers": [1, 2, 3]})
    assert response.json()["received"] == {"numbers": [1, 2, 3]}


@pytest.mark.anyio
async def test_convert_uses_mocked_upstream():
    app = create_app(upstream=fake_upstream({"EUR": 0.9}))
    async with asgi(app) as client:
        response = await client.get("/convert", params={"amount": "10", "to": "eur"})
    assert response.json() == {"amount": 10.0, "currency": "EUR", "converted": 9.0}


@pytest.mark.anyio
async def test_lifespan_hooks_are_skipped_by_asgi_transport():
    # No injected upstream, so before_serving would have created one had it run.
    async with asgi(create_app()) as client:
        response = await client.get("/convert", params={"amount": "10", "to": "EUR"})
    assert response.status_code == 503


@pytest.mark.anyio
async def test_abort_becomes_a_response():
    app = create_app(upstream=fake_upstream({}))
    async with asgi(app) as client:
        response = await client.get("/convert", params={"amount": "abc"})
    assert response.status_code == 400
    # abort() renders Quart's default HTML error page, not plain or JSON text.
    assert response.headers["content-type"].startswith("text/html")
    assert "amount must be numeric" in response.text


@pytest.mark.anyio
async def test_raise_app_exceptions_flag():
    app = create_app()
    app.config["PROPAGATE_EXCEPTIONS"] = True
    # Default ASGITransport re-raises, and Quart reports view errors wrapped
    # in an ExceptionGroup (from its internal task group), not as RuntimeError.
    with pytest.raises(ExceptionGroup) as excinfo:
        async with asgi(app) as client:
            await client.get("/boom")
    assert isinstance(excinfo.value.exceptions[0], RuntimeError)
    # ... set raise_app_exceptions=False to assert on the 500 response instead.
    async with asgi(app, raise_app_exceptions=False) as client:
        response = await client.get("/boom")
    assert response.status_code == 500
