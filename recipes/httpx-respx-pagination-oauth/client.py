import time
import httpx

class OAuthApiClient:
    def __init__(self, base_url: str, token_url: str, client_id: str, client_secret: str,
                 clock=time.monotonic, leeway: float = 30):
        self.token_url = token_url
        self.auth = (client_id, client_secret)
        self.clock = clock
        self.leeway = leeway  # refresh a little early so a token never expires mid-request
        self.token: str | None = None
        self.expires_at = 0.0
        self.http = httpx.Client(base_url=base_url, timeout=10)

    def _fetch_token(self) -> None:
        # client_credentials: credentials go in HTTP Basic auth, grant type in the form body
        r = self.http.post(self.token_url, data={"grant_type": "client_credentials"}, auth=self.auth)
        r.raise_for_status()
        body = r.json()
        self.token = body["access_token"]
        self.expires_at = self.clock() + body.get("expires_in", 3600) - self.leeway

    def _bearer(self) -> str:
        if self.token is None or self.clock() >= self.expires_at:
            self._fetch_token()
        return self.token

    def _get(self, url: str, params: dict | None = None) -> httpx.Response:
        r = self.http.get(url, params=params, headers={"Authorization": f"Bearer {self._bearer()}"})
        if r.status_code == 401:  # token revoked or expired early: refresh once and retry
            self._fetch_token()
            r = self.http.get(url, params=params, headers={"Authorization": f"Bearer {self.token}"})
        r.raise_for_status()
        return r

    def list_items(self, path: str, params: dict | None = None):
        url = path
        while url:
            r = self._get(url, params)
            yield from r.json()
            url = r.links.get("next", {}).get("url")  # httpx parses Link headers by rel
            params = None  # the next link already carries its own query string

    def close(self) -> None:
        self.http.close()
