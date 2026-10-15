import json
import time
from base64 import b64decode

import httpx
import pytest
from itsdangerous import TimestampSigner

from app import create_app, encode_session


def client_for(app):
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


@pytest.fixture
def app():
    return create_app(secret_key="s3cr3t")


async def test_session_roundtrip(app):
    async with client_for(app) as client:
        assert (await client.get("/login/alice")).status_code == 200
        assert client.cookies.get("session")
        assert (await client.get("/me")).json() == {"user": "alice"}


async def test_session_is_signed_not_encrypted(app):
    async with client_for(app) as client:
        await client.get("/login/alice")
        raw = client.cookies["session"]
    payload = TimestampSigner("s3cr3t").unsign(raw, max_age=60)
    assert json.loads(b64decode(payload)) == {"user": "alice"}


async def test_tampered_cookie_is_ignored(app):
    async with client_for(app) as client:
        r = await client.get("/me", headers={"Cookie": "session=not-a-real-signature"})
    assert r.json() == {"user": None}


async def test_non_json_value_raises(app):
    async with client_for(app) as client:
        with pytest.raises(TypeError):
            await client.get("/stash-non-json")


async def test_logout_clears_cookie(app):
    async with client_for(app) as client:
        await client.get("/login/alice")
        assert (await client.get("/me")).json() == {"user": "alice"}
        await client.get("/logout")
        assert client.cookies.get("session") is None
        assert (await client.get("/me")).json() == {"user": None}


async def test_max_age_expiry():
    app = create_app(secret_key="s3cr3t", max_age=60)
    old = encode_session({"user": "alice"}, "s3cr3t", timestamp=int(time.time()) - 3600)
    async with client_for(app) as client:
        r = await client.get("/me", headers={"Cookie": f"session={old}"})
    assert r.json() == {"user": None}
