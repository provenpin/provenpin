import httpx
from pydantic import BaseModel

class Repo(BaseModel):
    id: int
    full_name: str
    stargazers_count: int

class ApiClient:
    def __init__(self, base_url: str = "https://api.example.com", retries: int = 2):
        self.http = httpx.AsyncClient(base_url=base_url, timeout=10)
        self.retries = retries

    async def get_repo(self, owner: str, name: str) -> Repo:
        for attempt in range(self.retries + 1):
            r = await self.http.get(f"/repos/{owner}/{name}")
            if r.status_code < 500 or attempt == self.retries:
                break
        r.raise_for_status()
        return Repo.model_validate(r.json())

    async def aclose(self):
        await self.http.aclose()
