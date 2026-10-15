import httpx, pytest, respx
from client import ApiClient

URL = "https://api.example.com/repos/a/b"
REPO_JSON = {"id": 1, "full_name": "a/b", "stargazers_count": 5}


def make_client(sleeps: list[float]) -> ApiClient:
    # wait is patched to zero: the injected sleep records the delay instead of waiting
    async def fake_sleep(seconds: float):
        sleeps.append(seconds)

    return ApiClient(sleep=fake_sleep)


@pytest.mark.asyncio
@respx.mock
async def test_retry_after_seconds_is_honored():
    route = respx.get(URL).mock(side_effect=[
        httpx.Response(429, headers={"Retry-After": "7"}),
        httpx.Response(200, json=REPO_JSON),
    ])
    sleeps: list[float] = []
    c = make_client(sleeps)
    repo = await c.get_repo("a", "b")
    assert sleeps == [7.0]
    assert route.call_count == 2 and repo.stargazers_count == 5
    await c.aclose()


@pytest.mark.asyncio
@respx.mock
async def test_5xx_uses_exponential_backoff():
    route = respx.get(URL).mock(side_effect=[
        httpx.Response(503),
        httpx.Response(503),
        httpx.Response(200, json=REPO_JSON),
    ])
    sleeps: list[float] = []
    c = make_client(sleeps)
    await c.get_repo("a", "b")
    assert route.call_count == 3
    assert len(sleeps) == 2 and all(s > 0 for s in sleeps)
    await c.aclose()


@pytest.mark.asyncio
@respx.mock
async def test_404_is_not_retried():
    route = respx.get(URL).mock(return_value=httpx.Response(404))
    sleeps: list[float] = []
    c = make_client(sleeps)
    with pytest.raises(httpx.HTTPStatusError):
        await c.get_repo("a", "b")
    assert route.call_count == 1 and sleeps == []
    await c.aclose()


@pytest.mark.asyncio
@respx.mock
async def test_exhausted_retries_reraise_original_error():
    route = respx.get(URL).mock(return_value=httpx.Response(503))
    sleeps: list[float] = []
    c = make_client(sleeps)
    # reraise=True means the original HTTPStatusError surfaces, not tenacity.RetryError
    with pytest.raises(httpx.HTTPStatusError):
        await c.get_repo("a", "b")
    assert route.call_count == 3 and len(sleeps) == 2
    await c.aclose()


@pytest.mark.asyncio
@respx.mock
async def test_transport_error_is_retried():
    route = respx.get(URL).mock(side_effect=[
        httpx.ConnectError("boom"),
        httpx.Response(200, json=REPO_JSON),
    ])
    sleeps: list[float] = []
    c = make_client(sleeps)
    repo = await c.get_repo("a", "b")
    assert route.call_count == 2 and repo.full_name == "a/b"
    await c.aclose()
