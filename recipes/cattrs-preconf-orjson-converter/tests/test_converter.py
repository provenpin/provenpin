import json
from datetime import datetime, timedelta, time, timezone

import attrs
import cattrs
import orjson
import pytest
from cattrs.preconf.orjson import make_converter

from converter import Session, converter, dump, load


def make_session() -> Session:
    return Session(
        id=7,
        label="login",
        started_at=datetime(2026, 1, 2, 3, 4, 5, 123456, tzinfo=timezone.utc),
        expires_at=datetime(
            2026, 1, 2, 4, 4, 5, 123456, tzinfo=timezone(timedelta(hours=5, minutes=30))
        ),
        tags=["web", "mfa"],
    )


def test_roundtrip_preserves_aware_datetimes_and_microseconds():
    session = make_session()
    payload = dump(session)
    assert isinstance(payload, bytes)
    assert load(payload) == session
    assert load(payload).started_at.microsecond == 123456


def test_naive_datetimes_are_written_without_an_offset():
    session = Session(
        id=1,
        label="x",
        started_at=datetime(2026, 1, 2, 3, 4, 5),
        expires_at=datetime(2026, 1, 2, 3, 4, 5),
    )
    assert orjson.loads(dump(session))["started_at"] == "2026-01-02T03:04:05"
    assert load(dump(session)).started_at.tzinfo is None


def test_unstructure_keeps_datetime_objects_for_orjson():
    unstructured = converter.unstructure(make_session())
    assert isinstance(unstructured["started_at"], datetime)
    with pytest.raises(TypeError):
        json.dumps(unstructured)  # stdlib json has no datetime encoder here
    assert isinstance(converter.dumps(make_session()), bytes)


def test_time_values_dump_but_have_no_structure_hook():
    local = make_converter()

    @attrs.define
    class Slot:
        at: time

    payload = local.dumps(Slot(time(3, 4, 5)))
    assert payload == b'{"at":"03:04:05"}'
    with pytest.raises(cattrs.errors.StructureHandlerNotFoundError):
        local.loads(payload, Slot)
    local.register_structure_hook(time, lambda value, _: time.fromisoformat(value))
    assert local.loads(payload, Slot) == Slot(time(3, 4, 5))


def test_orjson_options_pass_through_to_dumps_only():
    session = make_session()
    payload = converter.dumps(session, option=orjson.OPT_INDENT_2)
    assert payload.startswith(b"{\n")
    assert load(payload) == session
