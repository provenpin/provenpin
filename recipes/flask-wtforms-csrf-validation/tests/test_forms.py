import re

import pytest

from app import create_app

VALID = {"name": "Demo", "slug": "demo-1", "seats": "5"}
TOKEN = re.compile(r'name="csrf_token"[^>]*value="([^"]+)"')


@pytest.fixture
def client():
    # CSRF disabled for this app only; the form is validated without a token.
    return create_app({"WTF_CSRF_ENABLED": False}).test_client()


@pytest.fixture
def app():
    # Default config: CSRF enforced.
    return create_app()


def test_csrf_disabled_in_test_config(client):
    r = client.post("/projects/new", data=VALID)
    assert r.status_code == 201
    assert b"demo-1" in r.data


def test_csrf_enforced_rejects_missing_token(app):
    r = app.test_client().post("/projects/new", data=VALID)
    assert r.status_code == 422
    assert b"CSRF" in r.data


def test_token_is_session_bound(app):
    # The token is tied to the session cookie: the same client succeeds,
    # a fresh client presenting the same token is rejected.
    c = app.test_client()
    page = c.get("/projects/new").get_data(as_text=True)
    token = TOKEN.search(page).group(1)
    assert c.post("/projects/new", data={**VALID, "csrf_token": token}).status_code == 201
    other = app.test_client()
    assert other.post("/projects/new", data={**VALID, "csrf_token": token}).status_code == 422


def test_custom_validator_errors_rendered(client):
    # Whitespace-only name is stripped by the filter, then fails DataRequired.
    r = client.post("/projects/new", data={"name": "   ", "slug": "Bad Slug", "seats": "5"})
    assert r.status_code == 422
    assert b"lowercase letters" in r.data
    assert b"This field is required." in r.data
