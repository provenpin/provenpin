import logging

import pytest
from loguru import logger

from logsetup import setup_propagation
from orders import charge

@pytest.fixture
def propagate(caplog):
    caplog.set_level(logging.DEBUG)
    sink_id = setup_propagation()
    yield
    logger.remove(sink_id)  # without this, sinks leak and every later test sees duplicates

def test_records_reach_caplog(propagate, caplog):
    charge("o1", 500)
    assert "charging order" in caplog.messages
    assert "charged" in caplog.messages

def test_bound_context_travels_as_extra(propagate, caplog):
    charge("o1", 500)
    rec = next(r for r in caplog.records if r.getMessage() == "charging order")
    assert rec.loguru_extra == {"order_id": "o1", "amount_cents": 500}

def test_success_level_has_a_stdlib_name(propagate, caplog):
    charge("o1", 500)
    rec = next(r for r in caplog.records if r.getMessage() == "charged")
    assert rec.levelname == "SUCCESS" and rec.levelno == 25

def test_braces_and_percent_are_not_reformatted(propagate, caplog):
    logger.info("100% done, {not_a_field}")
    assert caplog.messages[-1] == "100% done, {not_a_field}"

def test_bind_keys_named_like_logrecord_attrs(propagate, caplog):
    logger.bind(message="hi", name="x").info("ok")
    rec = caplog.records[-1]
    assert rec.loguru_extra["message"] == "hi" and rec.loguru_extra["name"] == "x"
