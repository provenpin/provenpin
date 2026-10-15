import asyncio
import email.utils
from dataclasses import dataclass
from datetime import datetime, timezone

import httpx
from tenacity import AsyncRetrying, retry_if_exception, stop_after_attempt, wait_exponential

_backoff = wait_exponential(multiplier=0.5, max=8)


@dataclass(frozen=True)
class Repo:
    id: int
    full_name: str
    stargazers_count: int


def _retry_after(response: httpx.Response) -> float | None:
    value = response.headers.get("Retry-After")
    if value is None:
        return None
    if value.isdigit():
        return float(value)
    # Retry-After may also be an HTTP date
    try:
        when = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    return max(0.0, (when - datetime.now(timezone.utc)).total_seconds())


def _wait(retry_state) -> float:
    exc = retry_state.outcome.exception()
    if isinstance(exc, httpx.HTTPStatusError):
        delay = _retry_after(exc.response)
        if delay is not None:
            return delay
    return _backoff(retry_state)


def _should_retry(exc: BaseException) -> bool:
    if isinstance(exc, httpx.TransportError):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        code = exc.response.status_code
        return code == 429 or code >= 500
    return False


class ApiClient:
    def __init__(self, base_url: str = "https://api.example.com", attempts: int = 3, sleep=asyncio.sleep):
        self.http = httpx.AsyncClient(base_url=base_url, timeout=10)
        self.attempts = attempts
        self.sleep = sleep

    async def _get(self, path: str) -> httpx.Response:
        # A fresh AsyncRetrying per call: retry state lives on the instance,
        # so sharing one across concurrent calls would mix up their attempts.
        retrying = AsyncRetrying(
            stop=stop_after_attempt(self.attempts),
            wait=_wait,
            retry=retry_if_exception(_should_retry),
            sleep=self.sleep,
            reraise=True,  # raise the original error, not tenacity.RetryError
        )
        async for attempt in retrying:
            with attempt:
                r = await self.http.get(path)
                # must raise inside the block, or a 5xx is returned as a success and never retried
                r.raise_for_status()
        return r

    async def get_repo(self, owner: str, name: str) -> Repo:
        r = await self._get(f"/repos/{owner}/{name}")
        d = r.json()
        # pick known fields explicitly so extra API keys are ignored
        return Repo(id=d["id"], full_name=d["full_name"], stargazers_count=d["stargazers_count"])

    async def aclose(self):
        await self.http.aclose()
