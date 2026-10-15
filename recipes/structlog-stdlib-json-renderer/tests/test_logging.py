import io
import json
import logging

import pytest
import structlog
from structlog.processors import JSONRenderer

from logging_setup import configure_logging


class Money:
    def __init__(self, amount: int) -> None:
        self.amount = amount

    def __structlog__(self):
        return {"amount": self.amount}


@pytest.fixture(autouse=True)
def configured():
    structlog.contextvars.clear_contextvars()
    configure_logging()
    yield
    structlog.contextvars.clear_contextvars()


@pytest.fixture
def rendered():
    handler = next(
        h
        for h in logging.getLogger().handlers
        if getattr(h, "_json_renderer_handler", False)
    )
    buf = io.StringIO()
    original, handler.stream = handler.stream, buf
    yield lambda: json.loads(buf.getvalue().strip().splitlines()[-1])
    handler.stream = original


def test_emits_one_json_line_with_context(rendered):
    log = structlog.get_logger("app")
    structlog.contextvars.bind_contextvars(request_id="r-1")
    log.info("user_login", user="ada", count=3)
    event = rendered()
    assert event["event"] == "user_login"
    assert event["level"] == "info"
    assert event["logger"] == "app"
    assert event["request_id"] == "r-1"
    assert event["user"] == "ada" and event["count"] == 3


def test_caplog_holds_event_dict_not_json(caplog):
    structlog.get_logger("app").info("ohai", n=1)
    record = next(r for r in caplog.records if r.name == "app")
    assert record.msg["event"] == "ohai"
    assert record.msg["n"] == 1
    # caplog renders the stdlib record itself, so its text is a dict repr,
    # not the JSON our handler produced.
    with pytest.raises(json.JSONDecodeError):
        json.loads(caplog.text)


def test_format_exc_info_keeps_json_parseable(rendered):
    log = structlog.get_logger("app")
    try:
        1 / 0
    except ZeroDivisionError:
        log.exception("boom")
    event = rendered()
    assert event["event"] == "boom"
    assert "ZeroDivisionError" in event["exception"]


def test_custom_default_disables_structlog_dunder():
    payload = {"event": "pay", "amount": Money(5)}
    assert json.loads(JSONRenderer()(None, "info", payload))["amount"] == {"amount": 5}
    # Passing default= turns off the __structlog__ hook, so Money falls back.
    rendered = json.loads(JSONRenderer(default=str)(None, "info", payload))
    assert rendered["amount"] != {"amount": 5}


def test_foreign_stdlib_logger_is_json_too(rendered, caplog):
    logging.getLogger("lib").warning("legacy code")
    event = rendered()
    assert event["event"] == "legacy code"
    assert event["level"] == "warning"
    foreign = next(r for r in caplog.records if r.name == "lib")
    assert foreign.msg == "legacy code"
