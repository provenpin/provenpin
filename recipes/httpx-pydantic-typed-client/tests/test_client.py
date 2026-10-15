import asyncio

import httpx
import pytest
import respx
from pydantic import ValidationError

from client import ApiClient, Repo

URL = "https://api.example.com/repos/a/b"
OK = {"id": 1, "full_name": "a/b", "stargazers_count": 5}


def run(coro):
    # sync tests + asyncio.run: no pytest-asyncio dependency needed
    return asyncio.run(coro)


async def fetch(owner="a", name="b"):
    async with ApiClient() as c:
        return await c.get_repo(owner, name)


@respx.mock
def test_parses_and_ignores_extra_fields():
    respx.get(URL).mock(return_value=httpx.Response(200, json={**OK, "extra": True}))
    assert run(fetch()) == Repo(id=1, full_name="a/b", stargazers_count=5)


@respx.mock
def test_retries_5xx_then_succeeds():
    route = respx.get(URL).mock(side_effect=[httpx.Response(503), httpx.Response(200, json=OK)])
    run(fetch())
    assert route.call_count == 2


@respx.mock
def test_retries_transport_errors():
    route = respx.get(URL).mock(side_effect=[httpx.ConnectTimeout("slow"), httpx.Response(200, json=OK)])
    assert run(fetch()).id == 1
    assert route.call_count == 2


@respx.mock
def test_4xx_is_not_retried():
    route = respx.get(URL).mock(return_value=httpx.Response(404))
    with pytest.raises(httpx.HTTPStatusError):
        run(fetch())
    assert route.call_count == 1


@respx.mock
def test_missing_field_raises_validation_error():
    respx.get(URL).mock(return_value=httpx.Response(200, json={"id": 1, "full_name": "a/b"}))
    with pytest.raises(ValidationError):
        run(fetch())


@respx.mock
def test_invalid_json_body_is_validation_error():
    respx.get(URL).mock(return_value=httpx.Response(200, content=b"<html>", headers={"content-type": "text/html"}))
    with pytest.raises(ValidationError):
        run(fetch())
