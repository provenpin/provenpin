import httpx
import pytest

from app import app


@pytest.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


async def test_single_upload_is_parsed(client):
    r = await client.post(
        "/inspect",
        data={"note": "hi"},
        files={"files": ("a.txt", b"hello", "text/plain")},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["first"] == "a.txt"
    assert body["names"] == ["a.txt"]
    assert body["types"] == ["text/plain"]
    assert body["sizes"] == [5]
    assert body["texts"] == ["hello"]
    assert body["note"] == "hi"


async def test_repeated_file_field_first_vs_getlist(client):
    files = [
        ("files", ("a.txt", b"1", "text/plain")),
        ("files", ("b.txt", b"22", "text/plain")),
    ]
    r = await client.post("/inspect", files=files)
    body = r.json()
    # form["files"] keeps only the first part; getlist returns every part.
    assert body["first"] == "a.txt"
    assert body["names"] == ["a.txt", "b.txt"]
    assert body["sizes"] == [1, 2]


async def test_repeated_text_field_getlist(client):
    r = await client.post("/inspect", data={"tags": ["x", "y"]})
    body = r.json()
    assert body["tags"] == ["x", "y"]
    assert body["names"] == []
    assert body["first"] is None


async def test_reread_requires_seek(client):
    r = await client.post("/digest", files={"files": ("a.txt", b"abcdef", "text/plain")})
    assert r.json() == {"head": "abcd", "rest": "ef", "whole": "abcdef"}


async def test_max_files_limit_becomes_400(client):
    files = [
        ("files", ("a.txt", b"1", "text/plain")),
        ("files", ("b.txt", b"2", "text/plain")),
    ]
    r = await client.post("/capped", files=files)
    assert r.status_code == 400
    # Plain Starlette renders HTTPException as text, not JSON like FastAPI does.
    assert r.text == "Too many files. Maximum number of files is 1."
