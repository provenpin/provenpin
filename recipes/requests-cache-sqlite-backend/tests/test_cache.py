import time
from datetime import timedelta

import pytest
import responses

from cache_session import make_session

URL = "https://api.example.com/items/1"

@pytest.fixture
def rsps():
    with responses.RequestsMock() as m:
        yield m

def test_second_get_served_from_sqlite(tmp_path, rsps):
    rsps.get(URL, json={"id": 1})
    with make_session(tmp_path / "http.sqlite") as s:
        first = s.get(URL)
        second = s.get(URL)
    assert not first.from_cache
    assert second.from_cache
    assert second.json() == {"id": 1}
    assert len(rsps.calls) == 1

def test_cache_survives_new_session(tmp_path, rsps):
    # The sqlite file is the cache, so a fresh session on the same path reuses it.
    db = tmp_path / "http.sqlite"
    rsps.get(URL, json={"id": 1})
    with make_session(db) as s:
        s.get(URL)
    with make_session(db) as s:
        assert s.get(URL).from_cache
    assert len(rsps.calls) == 1

def test_entry_expires(tmp_path, rsps):
    rsps.get(URL, json={"id": 1})
    with make_session(tmp_path / "http.sqlite", ttl=timedelta(seconds=1)) as s:
        s.get(URL)
        time.sleep(1.1)
        assert not s.get(URL).from_cache
    assert len(rsps.calls) == 2

def test_server_errors_not_cached(tmp_path, rsps):
    rsps.get(URL, status=500)
    rsps.get(URL, json={"id": 1})
    with make_session(tmp_path / "http.sqlite") as s:
        assert s.get(URL).status_code == 500
        r = s.get(URL)
    assert r.status_code == 200 and not r.from_cache
    assert len(rsps.calls) == 2
