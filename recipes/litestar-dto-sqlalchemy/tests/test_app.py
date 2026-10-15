import pytest
from litestar.testing import TestClient

from app import create_app


@pytest.fixture
def client(tmp_path):
    # A file-backed SQLite DB: each pooled connection to ":memory:" would see its own empty database.
    app = create_app(f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    # The context manager runs the lifespan, which creates the tables.
    with TestClient(app) as c:
        yield c


def test_create_returns_201_without_audit_fields(client):
    r = client.post("/authors", json={"name": "Ada", "email": "ada@example.com"})
    assert r.status_code == 201
    body = r.json()
    assert body["id"] and body["name"] == "Ada"
    assert "created_at" not in body and "updated_at" not in body


def test_created_author_is_visible_to_later_requests(client):
    # A new request gets a new session, so this only passes if the create was committed.
    new_id = client.post("/authors", json={"name": "Grace", "email": "g@example.com"}).json()["id"]
    r = client.get(f"/authors/{new_id}")
    assert r.status_code == 200
    assert r.json()["email"] == "g@example.com"


def test_missing_field_is_400(client):
    r = client.post("/authors", json={"name": "No Email"})
    assert r.status_code == 400


def test_unknown_id_is_404(client):
    assert client.get("/authors/999").status_code == 404
