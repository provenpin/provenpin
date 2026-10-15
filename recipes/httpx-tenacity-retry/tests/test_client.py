import httpx
import pytest
import respx
from client import ApiClient

BASE = "https://api.example.test"

def client(attempts=4):
    return ApiClient(BASE, attempts=attempts, wait_max=0)

@respx.mock
def test_retries_5xx_then_succeeds():
    route = respx.get(f"{BASE}/x").mock(side_effect=[httpx.Response(503), httpx.Response(502), httpx.Response(200, json={"ok": True})])
    assert client().get_json("/x") == {"ok": True}
    assert route.call_count == 3

@respx.mock
def test_retries_timeouts():
    route = respx.get(f"{BASE}/x").mock(side_effect=[httpx.ReadTimeout("slow"), httpx.Response(200, json=[])])
    assert client().get_json("/x") == [] and route.call_count == 2

@respx.mock
def test_no_retry_on_404():
    route = respx.get(f"{BASE}/x").mock(return_value=httpx.Response(404))
    with pytest.raises(httpx.HTTPStatusError):
        client().get_json("/x")
    assert route.call_count == 1

@respx.mock
def test_gives_up_and_reraises():
    route = respx.get(f"{BASE}/x").mock(return_value=httpx.Response(500))
    with pytest.raises(httpx.HTTPStatusError):
        client(attempts=3).get_json("/x")
    assert route.call_count == 3
