import httpx
from aiolimiter import AsyncLimiter


class RateLimitedClient:
    def __init__(
        self,
        max_rate: float = 5,
        time_period: float = 1.0,
        base_url: str = "https://api.example.com",
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        self.limiter = AsyncLimiter(max_rate, time_period)
        self.http = httpx.AsyncClient(base_url=base_url, timeout=10, transport=transport)

    async def get_json(self, path: str) -> dict:
        async with self.limiter:
            r = await self.http.get(path)
            r.raise_for_status()
            return r.json()

    async def aclose(self) -> None:
        await self.http.aclose()
