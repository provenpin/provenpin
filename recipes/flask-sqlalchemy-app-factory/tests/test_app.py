import pytest
from app import create_app

@pytest.fixture
def client():
    return create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite://"}).test_client()

def test_add_and_list(client):
    assert client.post("/notes", json={"text": "hi"}).status_code == 201
    assert client.get("/notes").get_json() == [{"id": 1, "text": "hi"}]

def test_validation(client):
    assert client.post("/notes", json={}).status_code == 400
