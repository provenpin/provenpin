import datetime

import orjson
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import StatementError
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.pool import StaticPool

from models import Base, Event, dumps, make_engine


@pytest.fixture
def engine():
    engine = make_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    return engine


def test_roundtrip_is_single_encoded_and_queryable(engine):
    with Session(engine) as s:
        s.add(Event(id=1, name="deploy", payload={"env": "prod", "count": 2}, tags=["a"]))
        s.commit()
    with engine.connect() as conn:
        raw = conn.execute(text("select payload from events")).scalar()
        assert raw == '{"env":"prod","count":2}'
        assert conn.execute(text("select json_extract(payload, '$.count') from events")).scalar() == 2


def test_forgetting_decode_stores_a_blob():
    engine = create_engine("sqlite://", json_serializer=orjson.dumps, json_deserializer=orjson.loads, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        s.add(Event(id=1, name="x", payload={"a": 1}, tags=[]))
        s.commit()
    with engine.connect() as conn:
        kind = conn.execute(text("select typeof(payload) from events")).scalar()
    assert isinstance(orjson.dumps({"a": 1}), bytes)
    assert isinstance(dumps({"a": 1}), str)
    assert kind == "blob"


def test_datetime_is_serialized_to_an_iso_string(engine):
    ts = datetime.datetime(2026, 1, 2, 3, 4, 5, tzinfo=datetime.timezone.utc)
    with Session(engine) as s:
        s.add(Event(id=1, name="t", payload={"at": ts}, tags=[]))
        s.commit()
    with Session(engine) as s:
        assert s.get(Event, 1).payload["at"] == "2026-01-02T03:04:05+00:00"


def test_mutable_dict_tracks_top_level_changes(engine):
    with Session(engine) as s:
        s.add(Event(id=1, name="m", payload={"count": 1}, tags=[]))
        s.commit()
    with Session(engine) as s:
        event = s.get(Event, 1)
        event.payload["count"] = 2
        event.tags.append("new")
        s.commit()
    with Session(engine) as s:
        event = s.get(Event, 1)
        assert event.payload["count"] == 2
        assert event.tags == ["new"]


def test_nested_mutation_is_lost_until_you_flag_it(engine):
    with Session(engine) as s:
        s.add(Event(id=1, name="n", payload={"nested": {"x": 1}}, tags=[]))
        s.commit()
    with Session(engine) as s:
        event = s.get(Event, 1)
        event.payload["nested"]["x"] = 99
        s.commit()
    with Session(engine) as s:
        assert s.get(Event, 1).payload["nested"]["x"] == 1
    with Session(engine) as s:
        event = s.get(Event, 1)
        event.payload["nested"]["x"] = 99
        flag_modified(event, "payload")
        s.commit()
    with Session(engine) as s:
        assert s.get(Event, 1).payload["nested"]["x"] == 99


def test_orjson_rejects_non_string_keys_and_sets(engine):
    with pytest.raises(TypeError):
        orjson.dumps({1: "a"})
    assert orjson.dumps({1: "a"}, option=orjson.OPT_NON_STR_KEYS) == b'{"1":"a"}'
    with pytest.raises(StatementError):
        with Session(engine) as s:
            s.add(Event(id=1, name="bad", payload={"s": {1, 2}}, tags=[]))
            s.flush()
