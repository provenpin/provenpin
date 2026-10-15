from argon2 import PasswordHasher
from fastapi.testclient import TestClient

from app import DUMMY_HASH, app, ph, users

# Deliberately weak parameters to simulate a hash created under an older policy.
WEAK = PasswordHasher(time_cost=1, memory_cost=8, parallelism=1)


def login(client, username, password):
    return client.post("/login", data={"username": username, "password": password})


def setup_function():
    users.clear()


def test_login_ok_and_stores_hash_not_password():
    users["ann"] = ph.hash("s3cret-pass")
    r = login(TestClient(app), "ann", "s3cret-pass")
    assert r.status_code == 200 and r.json() == {"username": "ann"}
    assert users["ann"].startswith("$argon2id$")
    assert users["ann"] != "s3cret-pass"


def test_wrong_password_and_unknown_user_look_identical():
    users["ann"] = ph.hash("right")
    client = TestClient(app)
    wrong = login(client, "ann", "wrong")
    ghost = login(client, "nobody", "wrong")
    assert wrong.status_code == ghost.status_code == 401
    assert wrong.json() == ghost.json()


def test_unknown_user_cannot_match_dummy_password():
    # The dummy hash is only a timing shield; its plaintext must never grant access.
    r = login(TestClient(app), "nobody", "dummy-password-never-matches")
    assert r.status_code == 401
    assert ph.verify(DUMMY_HASH, "dummy-password-never-matches")


def test_failed_login_does_not_rehash():
    old = WEAK.hash("right")
    users["ann"] = old
    r = login(TestClient(app), "ann", "wrong")
    assert r.status_code == 401
    assert users["ann"] == old


def test_weak_hash_is_upgraded_on_successful_login():
    users["ann"] = WEAK.hash("hunter2-long")
    r = login(TestClient(app), "ann", "hunter2-long")
    assert r.status_code == 200
    assert not ph.check_needs_rehash(users["ann"])
    assert ph.verify(users["ann"], "hunter2-long")


def test_json_body_is_rejected_because_login_takes_form_data():
    users["ann"] = ph.hash("pw")
    r = TestClient(app).post("/login", json={"username": "ann", "password": "pw"})
    assert r.status_code == 422
