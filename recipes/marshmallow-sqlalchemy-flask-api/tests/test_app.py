import pytest
from app import create_app, db


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_create_returns_201_and_dumps_id(client):
    r = client.post("/books", json={"title": "Dune", "isbn": "9780441013593"})
    assert r.status_code == 201
    body = r.get_json()
    assert body["id"] == 1
    assert body["title"] == "Dune"


def test_missing_required_field_is_422(client):
    r = client.post("/books", json={"isbn": "9780441013593"})
    assert r.status_code == 422
    assert "title" in r.get_json()["errors"]


def test_title_length_comes_from_column_type_422(client):
    # marshmallow-sqlalchemy derives a Length validator from String(120)
    r = client.post("/books", json={"title": "x" * 121, "isbn": "9780441013593"})
    assert r.status_code == 422
    assert "title" in r.get_json()["errors"]


def test_unknown_field_is_422(client):
    # marshmallow 3 defaults to unknown=RAISE, so extra keys fail validation
    r = client.post("/books", json={"title": "Dune", "isbn": "9780441013593", "pages": 412})
    assert r.status_code == 422
    assert "pages" in r.get_json()["errors"]


def test_duplicate_isbn_is_409_and_session_recovers(client):
    client.post("/books", json={"title": "Dune", "isbn": "9780441013593"})
    r = client.post("/books", json={"title": "Dune again", "isbn": "9780441013593"})
    assert r.status_code == 409
    # the session was rolled back, so a fresh insert still works
    r = client.post("/books", json={"title": "Emma", "isbn": "9780141439587"})
    assert r.status_code == 201
