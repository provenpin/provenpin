from datetime import datetime, timedelta, timezone

import jwt
from fastapi.testclient import TestClient

from app import ALGORITHM, SECRET_KEY, app, pwd

client = TestClient(app)


def login(username: str, password: str, scope: str = "me items:write"):
    return client.post("/token", data={"username": username, "password": password, "scope": scope})


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_login_and_read_profile():
    token = login("alice", "wonderland").json()["access_token"]
    r = client.get("/me", headers=bearer(token))
    assert r.status_code == 200 and r.json() == {"username": "alice"}


def test_scopes_are_intersected_at_login():
    # bob asks for items:write but is only allowed "me", so the token carries just "me"
    token = login("bob", "builder", scope="me items:write").json()["access_token"]
    assert client.get("/me", headers=bearer(token)).status_code == 200
    r = client.post("/items", params={"name": "x"}, headers=bearer(token))
    assert r.status_code == 403
    assert 'scope="items:write"' in r.headers["WWW-Authenticate"]


def test_wrong_password_is_401():
    assert login("alice", "nope").status_code == 401


def test_forged_and_expired_tokens_rejected():
    forged = jwt.encode({"sub": "alice", "scopes": ["me"]}, "not-the-secret", algorithm=ALGORITHM)
    expired = jwt.encode(
        {"sub": "alice", "scopes": ["me"], "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    for token in (forged, expired):
        assert client.get("/me", headers=bearer(token)).status_code == 401


def test_password_hash_is_argon2_and_verifies():
    h = pwd.hash("s3cret")
    assert h.startswith("$argon2")
    assert pwd.verify("s3cret", h)
    assert not pwd.verify("wrong", h)
