from authlib.integrations.httpx_client import AsyncOAuth2Client


class ApiClient:
    def __init__(self, client_id, client_secret, token_url, api_url):
        self.api_url = api_url.rstrip("/")
        self.oauth = AsyncOAuth2Client(
            client_id=client_id,
            client_secret=client_secret,
            token_endpoint=token_url,
            grant_type="client_credentials",
        )

    async def fetch_token(self):
        return await self.oauth.fetch_token()

    async def get(self, path):
        return await self.oauth.get(f"{self.api_url}/{path.lstrip('/')}")

    async def aclose(self):
        await self.oauth.aclose()
