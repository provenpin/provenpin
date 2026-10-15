import json
from datetime import datetime, timedelta, timezone

from pydantic import BaseModel

from compare import diff_models

NOW = datetime(2024, 1, 1, tzinfo=timezone.utc)


class Event(BaseModel):
    name: str
    tags: set[str] = set()
    steps: list[str] = []
    meta: dict[str, int] = {}
    at: datetime
    score: float = 0.0


def test_dict_key_order_is_ignored():
    a = Event(name="x", meta={"a": 1, "b": 2}, at=NOW)
    b = Event(name="x", meta={"b": 2, "a": 1}, at=NOW)
    assert diff_models(a, b) == {}


def test_list_order_is_significant_until_ignored():
    a = Event(name="x", steps=["build", "test"], at=NOW)
    b = Event(name="x", steps=["test", "build"], at=NOW)
    assert "values_changed" in diff_models(a, b)
    assert diff_models(a, b, ignore_order=True) == {}


def test_python_dump_vs_json_payload_types():
    a = Event(name="x", tags={"a", "b"}, at=NOW)
    wire = json.loads(a.model_dump_json())
    assert "type_changes" in diff_models(a, wire)
    assert diff_models(a, wire, json_mode=True) == {}


def test_aware_datetimes_same_instant_but_different_json():
    a = Event(name="x", at=datetime.fromisoformat("2024-01-01T00:00:00+00:00"))
    b = Event(name="x", at=datetime.fromisoformat("2023-12-31T19:00:00-05:00"))
    assert diff_models(a, b) == {}
    assert "values_changed" in diff_models(a, b, json_mode=True)


def test_float_noise_needs_significant_digits():
    a = Event(name="x", score=0.1 + 0.2, at=NOW)
    b = Event(name="x", score=0.3, at=NOW)
    assert "values_changed" in diff_models(a, b)
    assert diff_models(a, b, significant_digits=6) == {}


def test_exclude_paths_skips_volatile_fields():
    a = Event(name="x", at=NOW)
    b = Event(name="x", at=NOW + timedelta(seconds=1))
    assert "values_changed" in diff_models(a, b)
    assert diff_models(a, b, exclude_paths={"root['at']"}) == {}
