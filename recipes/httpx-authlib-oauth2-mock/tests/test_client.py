import base64

import httpx
import pytest
import respx

from authlib.integrations.base_client.errors import MissingTokenError, OAuthError

from client import ApiClient

TOKEN_URL = "https://auth.example.com/oauth/token"
API_URL = "https://api.example.com"


def make_client():
    return ApiClient("myid", "mysecret", TOKEN_URL, API_URL)


def token_response(token="abc"):
    return httpx.Response(
        200,
        json={"access_token": token, "token_type": "Bearer", "expires_in": 3600},
    )


@respx.mock
async def test_fetch_token_uses_client_credentials_and_basic_auth():
    route = respx.post(TOKEN_URL).mock(return_value=token_response())
    c = make_client()
    token = await c.fetch_token()
    assert token["access_token"] == "abc"
    request = route.calls.last.request
    assert b"grant_type=client_credentials" in request.content
    expected = base64.b64encode(b"myid:mysecret").decode()
    assert request.headers["authorization"] == f"Basic {expected}"
    await c.aclose()


@respx.mock
async def test_get_without_token_raises_missing_token():
    c = make_client()
    with pytest.raises(MissingTokenError):
        await c.get("/me")
    await c.aclose()


@respx.mock
async def test_api_request_carries_bearer_token():
    respx.post(TOKEN_URL).mock(return_value=token_response("tok123"))
    api = respx.get(f"{API_URL}/me").mock(return_value=httpx.Response(200, json={"login": "octocat"}))
    c = make_client()
    await c.fetch_token()
    resp = await c.get("/me")
    assert resp.json()["login"] == "octocat"
    assert api.calls.last.request.headers["authorization"] == "Bearer tok123"
    await c.aclose()


@respx.mock
async def test_token_is_cached_between_calls():
    token = respx.post(TOKEN_URL).mock(return_value=token_response())
    respx.get(f"{API_URL}/me").mock(return_value=httpx.Response(200, json={}))
    c = make_client()
    await c.fetch_token()
    await c.get("/me")
    await c.get("/me")
    assert token.call_count == 1
    await c.aclose()


@respx.mock
async def test_expired_token_is_refreshed_for_client_credentials():
    token = respx.post(TOKEN_URL).mock(side_effect=[token_response("old"), token_response("new")])
    api = respx.get(f"{API_URL}/me").mock(return_value=httpx.Response(200, json={}))
    c = make_client()
    await c.fetch_token()
    c.oauth.token["expires_at"] = 0
    await c.get("/me")
    assert token.call_count == 2
    assert api.calls.last.request.headers["authorization"] == "Bearer new"
    await c.aclose()


@respx.mock
async def test_rejected_client_raises_oauth_error():
    respx.post(TOKEN_URL).mock(
        return_value=httpx.Response(401, json={"error": "invalid_client", "error_description": "bad creds"})
    )
    c = make_client()
    with pytest.raises(OAuthError):
        await c.fetch_token()
    await c.aclose()
