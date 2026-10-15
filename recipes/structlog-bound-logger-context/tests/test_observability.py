import io
import json
import logging

import pytest
import structlog

from observability import configure_logging, reset_logging


@pytest.fixture(autouse=True)
def clean_logging():
    reset_logging()
    yield
    reset_logging()


def last_record(stream):
    return json.loads(stream.getvalue().splitlines()[-1])


def test_merge_contextvars_into_structlog():
    stream = io.StringIO()
    log = configure_logging(stream)
    structlog.contextvars.bind_contextvars(request_id="abc")
    log.info("hello", user=1)
    rec = last_record(stream)
    assert rec["event"] == "hello"
    assert rec["request_id"] == "abc"
    assert rec["user"] == 1


def test_bound_contextvars_is_scoped():
    stream = io.StringIO()
    log = configure_logging(stream)
    with structlog.contextvars.bound_contextvars(task="import"):
        log.info("in")
    log.info("out")
    records = [json.loads(line) for line in stream.getvalue().splitlines()]
    assert records[0]["task"] == "import"
    assert "task" not in records[1]


def test_explicit_event_key_wins_over_contextvar():
    stream = io.StringIO()
    log = configure_logging(stream)
    structlog.contextvars.bind_contextvars(user="ctx")
    log.info("e", user="explicit")
    assert last_record(stream)["user"] == "explicit"


def test_foreign_stdlib_record_uses_json_and_context():
    stream = io.StringIO()
    configure_logging(stream)
    structlog.contextvars.bind_contextvars(request_id="r1")
    logging.getLogger("third.party").warning("issued a warning")
    rec = last_record(stream)
    assert rec["event"] == "issued a warning"
    assert rec["level"] == "warning"
    assert rec["logger"] == "third.party"
    assert rec["request_id"] == "r1"


def test_processors_meta_is_stripped():
    stream = io.StringIO()
    log = configure_logging(stream)
    log.info("clean")
    rec = last_record(stream)
    assert "_record" not in rec and "_from_structlog" not in rec


def test_capture_logs_skips_contextvars():
    log = configure_logging(io.StringIO())
    structlog.contextvars.bind_contextvars(request_id="abc")
    with structlog.testing.capture_logs() as captured:
        log.info("captured")
    assert "request_id" not in captured[0]
