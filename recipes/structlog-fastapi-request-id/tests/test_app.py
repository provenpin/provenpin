import re

from fastapi.testclient import TestClient
from structlog.contextvars import merge_contextvars
from structlog.testing import capture_logs

from app import app

# raise_server_exceptions=False so unhandled errors come back as 500 responses.
client = TestClient(app, raise_server_exceptions=False)


def test_echoes_incoming_request_id():
    r = client.get("/hello", headers={"X-Request-ID": "abc-123"})
    assert r.status_code == 200
    assert r.headers["x-request-id"] == "abc-123"


def test_generates_id_when_missing():
    r = client.get("/hello")
    assert re.fullmatch(r"[0-9a-f]{32}", r.headers["x-request-id"])


def test_replaces_unsafe_incoming_id():
    r = client.get("/hello", headers={"X-Request-ID": "bad id with spaces"})
    assert re.fullmatch(r"[0-9a-f]{32}", r.headers["x-request-id"])


def test_logs_carry_request_id():
    # capture_logs swaps the processor chain, so merge_contextvars must be passed back in.
    with capture_logs(processors=[merge_contextvars]) as logs:
        client.get("/hello", headers={"X-Request-ID": "req-1"})
    hello = [e for e in logs if e["event"] == "hello_called"]
    assert hello[0]["request_id"] == "req-1"


def test_context_cleared_after_error():
    with capture_logs(processors=[merge_contextvars]) as logs:
        r1 = client.get("/boom", headers={"X-Request-ID": "fail-1"})
        r2 = client.get("/hello")
    assert r1.status_code == 500
    hello = [e for e in logs if e["event"] == "hello_called"]
    assert hello[0]["request_id"] == r2.headers["x-request-id"] != "fail-1"
