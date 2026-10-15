import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

@pytest.fixture
def auth_client():
    c = APIClient()
    c.force_authenticate(User.objects.create_user("ada"))
    return c

def test_create_and_list(auth_client):
    r = auth_client.post("/books/", {"title": "SICP", "isbn": "9780262510875"}, format="json")
    assert r.status_code == 201
    assert APIClient().get("/books/").json()[0]["title"] == "SICP"

def test_validation(auth_client):
    r = auth_client.post("/books/", {"title": "X", "isbn": "abc"}, format="json")
    assert r.status_code == 400 and "isbn" in r.json()

def test_anonymous_cannot_write():
    assert APIClient().post("/books/", {"title": "X", "isbn": "1234567890"}, format="json").status_code in (401, 403)
