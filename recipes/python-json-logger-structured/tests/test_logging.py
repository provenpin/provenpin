from datetime import datetime, timezone

import pytest

from logging_setup import last_event, make_logger


def test_extra_fields_merge_with_static_fields():
    logger, buf = make_logger("t.extra")
    logger.info("order placed", extra={"order_id": "o-1", "amount": 42})
    event = last_event(buf)
    assert event["msg"] == "order placed"
    assert event["level"] == "INFO"
    assert event["name"] == "t.extra"
    assert event["service"] == "checkout"
    assert event["order_id"] == "o-1"
    assert event["amount"] == 42
    assert "ts" in event


def test_extra_cannot_overwrite_reserved_field():
    logger, _ = make_logger("t.collide")
    with pytest.raises(KeyError, match="in LogRecord"):
        logger.info("hi", extra={"message": "override"})


def test_exception_renders_as_string_by_default():
    logger, buf = make_logger("t.exc")
    try:
        1 / 0
    except ZeroDivisionError:
        logger.exception("boom")
    event = last_event(buf)
    assert event["msg"] == "boom"
    assert event["level"] == "ERROR"
    assert isinstance(event["exc_info"], str)
    assert "ZeroDivisionError" in event["exc_info"]


def test_exc_info_as_array_splits_lines():
    logger, buf = make_logger("t.excarr", exc_info_as_array=True)
    try:
        1 / 0
    except ZeroDivisionError:
        logger.exception("boom")
    event = last_event(buf)
    assert isinstance(event["exc_info"], list)
    assert event["exc_info"][0] == "Traceback (most recent call last):"
    assert any("ZeroDivisionError" in line for line in event["exc_info"])


def test_json_encoder_handles_datetime_and_unknown_objects():
    logger, buf = make_logger("t.enc")
    when = datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
    logger.info("saved", extra={"when": when, "blob": object()})
    event = last_event(buf)
    assert event["when"] == "2026-01-02T03:04:05+00:00"
    assert isinstance(event["blob"], str)


def test_renaming_missing_fields_is_opt_in():
    logger, buf = make_logger("t.rename", rename_fields={"message": "msg", "custom": "renamed"})
    logger.info("plain")
    event = last_event(buf)
    assert event["msg"] == "plain"
    assert "renamed" not in event

    keep, keep_buf = make_logger(
        "t.rename.keep",
        rename_fields={"message": "msg", "custom": "renamed"},
        rename_fields_keep_missing=True,
    )
    keep.info("plain")
    assert last_event(keep_buf)["renamed"] is None


def test_defaults_are_renamed_and_overridable():
    logger, buf = make_logger(
        "t.defaults",
        defaults={"env": "prod", "message": "unused"},
        rename_fields={"message": "msg", "env": "environment"},
    )
    logger.info("live")
    event = last_event(buf)
    assert event["environment"] == "prod"
    assert event["msg"] == "live"
