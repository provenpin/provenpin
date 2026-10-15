import pytest
from fastapi.testclient import TestClient

from app import ITEMS, app


@pytest.fixture
def client():
    ITEMS[:] = [{"id": 1, "name": "apples"}, {"id": 2, "name": "pears"}]
    with TestClient(app) as c:
        yield c


def test_browser_gets_full_page(client):
    r = client.get("/items")
    assert r.status_code == 200
    assert "<!doctype html>" in r.text
    assert "<html>" in r.text
    assert '<ul id="items">' in r.text


def test_htmx_gets_partial_only(client):
    r = client.get("/items", headers={"HX-Request": "true"})
    assert "<html" not in r.text
    assert '<ul id="items">' in r.text
    assert r.text.count("<li>") == 2


def test_vary_header_on_both_responses(client):
    # Caches must key on HX-Request or they may hand a fragment to a browser
    assert "HX-Request" in client.get("/items").headers["vary"]
    assert "HX-Request" in client.get("/items", headers={"HX-Request": "true"}).headers["vary"]


def test_header_value_must_be_true(client):
    # Presence alone is not enough: "false" should still get the full page
    r = client.get("/items", headers={"HX-Request": "false"})
    assert "<html>" in r.text


def test_partial_output_is_autoescaped(client):
    r = client.post("/items", params={"name": "<b>x</b>"})
    assert "&lt;b&gt;x&lt;/b&gt;" in r.text
    assert "<b>x</b>" not in r.text


def test_empty_name_rejected(client):
    r = client.post("/items", params={"name": ""})
    assert r.status_code == 422
