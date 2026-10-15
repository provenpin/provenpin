import pytest
from ninja.testing import TestClient

from catalog.api import api
from catalog.models import Book

client = TestClient(api)


@pytest.mark.django_db
def test_create_returns_201_and_persists():
    r = client.post("/books", json={"title": "Dune", "author": "Herbert", "year": 1965})
    assert r.status_code == 201
    assert r.json()["title"] == "Dune"
    assert Book.objects.filter(pk=r.json()["id"], year=1965).exists()


@pytest.mark.django_db
def test_pagination_returns_second_page_in_stable_order():
    for i in range(3):
        Book.objects.create(title=f"T{i}", author="A")
    r = client.get("/books?page=2")
    body = r.json()
    assert body["count"] == 3
    # page_size is 2, so page 2 holds only the third book; ordering by id makes this deterministic.
    assert [b["title"] for b in body["items"]] == ["T2"]


@pytest.mark.django_db
def test_missing_book_returns_404_with_detail():
    r = client.get("/books/999")
    assert r.status_code == 404
    assert r.json() == {"detail": "Book not found"}


@pytest.mark.django_db
def test_invalid_payload_returns_422():
    r = client.post("/books", json={"author": "no title"})
    assert r.status_code == 422


@pytest.mark.django_db
def test_partial_patch_keeps_unsent_fields():
    b = Book.objects.create(title="Keep", author="A", year=1990)
    r = client.patch(f"/books/{b.id}", json={"year": 2001})
    assert r.status_code == 200
    assert r.json()["title"] == "Keep"
    assert r.json()["year"] == 2001
