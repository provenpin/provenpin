from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_and_read():
    r = client.post("/items", json={"name": "widget"})
    assert r.status_code == 201
    item_id = r.json()["id"]
    assert client.get(f"/items/{item_id}").json() == {"id": item_id, "name": "widget"}

def test_missing_and_invalid():
    assert client.get("/items/9999").status_code == 404
    assert client.post("/items", json={}).status_code == 422
