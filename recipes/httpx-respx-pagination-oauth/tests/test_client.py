import httpx, respx
from client import OAuthApiClient

API = "https://api.example.com"
TOKEN_URL = "https://auth.example.com/oauth/token"

class FakeClock:
    def __init__(self):
        self.now = 0.0

    def __call__(self):
        return self.now

def make_client(clock=None):
    return OAuthApiClient(API, TOKEN_URL, "id", "secret", clock=clock or FakeClock())

def token_resp(token, expires_in=3600):
    return httpx.Response(200, json={"access_token": token, "expires_in": expires_in})

@respx.mock
def test_token_is_fetched_once_and_cached():
    token = respx.post(TOKEN_URL).mock(side_effect=[token_resp("t1")])
    respx.get(f"{API}/items").mock(return_value=httpx.Response(200, json=[]))
    c = make_client()
    list(c.list_items("/items"))
    list(c.list_items("/items"))
    assert token.call_count == 1
    assert token.calls[0].request.headers["Authorization"].startswith("Basic ")
    c.close()

@respx.mock
def test_refreshes_token_once_on_401():
    token = respx.post(TOKEN_URL).mock(side_effect=[token_resp("old"), token_resp("new")])
    items = respx.get(f"{API}/items").mock(
        side_effect=[httpx.Response(401), httpx.Response(200, json=[1])]
    )
    c = make_client()
    assert list(c.list_items("/items")) == [1]
    assert token.call_count == 2
    assert items.calls[1].request.headers["Authorization"] == "Bearer new"
    c.close()

@respx.mock
def test_refreshes_token_after_expiry_minus_leeway():
    clock = FakeClock()
    token = respx.post(TOKEN_URL).mock(side_effect=[token_resp("a", expires_in=100), token_resp("b")])
    respx.get(f"{API}/items").mock(return_value=httpx.Response(200, json=[]))
    c = make_client(clock)
    list(c.list_items("/items"))
    clock.now = 71  # 100s lifetime minus 30s leeway has passed
    list(c.list_items("/items"))
    assert token.call_count == 2
    c.close()

@respx.mock
def test_follows_link_header_pagination():
    respx.get(f"{API}/items", params={"page": "2"}).mock(
        return_value=httpx.Response(200, json=[3, 4])
    )
    respx.get(f"{API}/items").mock(
        return_value=httpx.Response(
            200, json=[1, 2],
            headers={"Link": f'<{API}/items?page=2>; rel="next"'},
        )
    )
    respx.post(TOKEN_URL).mock(return_value=token_resp("t"))
    c = make_client()
    assert list(c.list_items("/items")) == [1, 2, 3, 4]
    c.close()
