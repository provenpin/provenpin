import httpx
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

def _transient(exc: BaseException) -> bool:
    if isinstance(exc, (httpx.TimeoutException, httpx.ConnectError)):
        return True
    return isinstance(exc, httpx.HTTPStatusError) and (exc.response.status_code == 429 or exc.response.status_code >= 500)

class ApiClient:
    def __init__(self, base_url: str, attempts: int = 4, wait_max: float = 8.0):
        self.http = httpx.Client(base_url=base_url, timeout=5.0)
        self._get = retry(
            retry=retry_if_exception(_transient),
            stop=stop_after_attempt(attempts),
            wait=wait_exponential(multiplier=0.5, max=wait_max),
            reraise=True,  # surface the real httpx error, not tenacity.RetryError
        )(self._get_once)

    def _get_once(self, path: str):
        r = self.http.get(path)
        r.raise_for_status()
        return r.json()

    def get_json(self, path: str):
        return self._get(path)
