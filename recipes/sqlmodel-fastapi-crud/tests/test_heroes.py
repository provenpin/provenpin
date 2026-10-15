import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from app.main import app, get_session

@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)
    def override():
        with Session(engine) as s:
            yield s
    app.dependency_overrides[get_session] = override
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_crud(client):
    r = client.post("/heroes", json={"name": "Deadpond", "age": 30})
    assert r.status_code == 201
    hid = r.json()["id"]
    assert client.patch(f"/heroes/{hid}", json={"age": 31}).json() == {"id": hid, "name": "Deadpond", "age": 31}
    assert len(client.get("/heroes").json()) == 1
    assert client.delete(f"/heroes/{hid}").status_code == 204
    assert client.get("/heroes").json() == []

def test_validation_and_404(client):
    assert client.post("/heroes", json={"age": 3}).status_code == 422
    assert client.patch("/heroes/999", json={"age": 1}).status_code == 404
