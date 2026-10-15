from fastapi.testclient import TestClient
from app.main import app, make_token

client = TestClient(app)

def test_login_and_me():
    tok = client.post("/token", data={"username": "ada", "password": "correct-horse"}).json()["access_token"]
    assert client.get("/me", headers={"Authorization": f"Bearer {tok}"}).json() == {"user": "ada"}

def test_rejects_bad_and_expired():
    assert client.get("/me").status_code == 401
    expired = make_token("ada", minutes=-1)
    assert client.get("/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401
