from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

PASSWORD = "pw-123456"


@pytest.fixture
def user(db):
    return get_user_model().objects.create_user("ann", password=PASSWORD, is_staff=True)


@pytest.fixture
def api():
    return APIClient()


def bearer(token):
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


def obtain(api):
    r = api.post("/api/token/", {"username": "ann", "password": PASSWORD}, format="json")
    assert r.status_code == 200
    return r.data


def test_obtain_pair_has_custom_claim(api, user):
    access = AccessToken(obtain(api)["access"])
    assert access["role"] == "admin"


def test_bad_password_rejected(api, user):
    r = api.post("/api/token/", {"username": "ann", "password": "nope"}, format="json")
    assert r.status_code == 401


def test_protected_view_requires_token(api, user):
    assert api.get("/api/me/").status_code == 401
    r = api.get("/api/me/", **bearer(obtain(api)["access"]))
    assert r.status_code == 200
    assert r.data == {"username": "ann", "role": "admin"}


def test_expired_access_token_rejected(api, user):
    # ACCESS_TOKEN_LIFETIME is read when the token class is imported, so
    # override_settings has no effect here. Set the exp claim directly instead.
    token = AccessToken.for_user(user)
    token.set_exp(lifetime=timedelta(seconds=-1))
    assert api.get("/api/me/", **bearer(str(token))).status_code == 401


def test_refresh_keeps_custom_claims(api, user):
    refresh = obtain(api)["refresh"]
    r = api.post("/api/token/refresh/", {"refresh": refresh}, format="json")
    assert r.status_code == 200
    assert AccessToken(r.data["access"])["role"] == "admin"
