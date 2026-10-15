import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    return app.test_client()


def test_query_defaults_and_repeated_params(client):
    r = client.get("/search?q=hi&tags=a&tags=b&include_archived=true")
    assert r.status_code == 200
    assert r.get_json() == {"q": "hi", "page": 1, "tags": ["a", "b"], "include_archived": True}


def test_missing_required_query_is_422_not_400(client):
    r = client.get("/search")
    assert r.status_code == 422
    assert "q" in r.get_json()["errors"]["query"]


def test_range_validation_on_int_query(client):
    r = client.get("/search?q=x&page=0")
    assert r.status_code == 422
    assert "page" in r.get_json()["errors"]["query"]


def test_unknown_json_key_is_rejected(client):
    r = client.post("/items", json={"name": "bolt", "qty": 3, "color": "red"})
    assert r.status_code == 422
    assert "color" in r.get_json()["errors"]["json"]


def test_valid_json_creates_item(client):
    r = client.post("/items", json={"name": "bolt", "qty": 3})
    assert r.status_code == 201
    assert r.get_json() == {"name": "bolt", "qty": 3}
