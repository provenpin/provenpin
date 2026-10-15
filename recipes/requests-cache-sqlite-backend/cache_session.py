from datetime import timedelta
from pathlib import Path

import requests_cache

def make_session(db_path: Path, ttl: timedelta | None = timedelta(minutes=5)) -> requests_cache.CachedSession:
    # Only 200 responses are cached; errors always hit the network.
    return requests_cache.CachedSession(
        cache_name=str(db_path),
        backend="sqlite",
        expire_after=ttl,
        allowable_codes=(200,),
    )
