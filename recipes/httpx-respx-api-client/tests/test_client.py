import httpx, pytest, respx
from client import ApiClient

@pytest.mark.asyncio
@respx.mock
async def test_parses_repo():
    respx.get("https://api.example.com/repos/a/b").mock(return_value=httpx.Response(200, json={"id": 1, "full_name": "a/b", "stargazers_count": 5, "extra": True}))
    c = ApiClient()
    repo = await c.get_repo("a", "b")
    assert repo.full_name == "a/b" and repo.stargazers_count == 5
    await c.aclose()

@pytest.mark.asyncio
@respx.mock
async def test_retries_then_succeeds():
    route = respx.get("https://api.example.com/repos/a/b").mock(side_effect=[httpx.Response(503), httpx.Response(200, json={"id": 1, "full_name": "a/b", "stargazers_count": 0})])
    c = ApiClient()
    await c.get_repo("a", "b")
    assert route.call_count == 2
    await c.aclose()

@pytest.mark.asyncio
@respx.mock
async def test_404_raises():
    respx.get("https://api.example.com/repos/a/x").mock(return_value=httpx.Response(404))
    c = ApiClient()
    with pytest.raises(httpx.HTTPStatusError):
        await c.get_repo("a", "x")
    await c.aclose()
