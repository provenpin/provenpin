import pytest
from peewee import SqliteDatabase

from models import Event, append_tag, by_key, db, init_db


@pytest.fixture
def events():
    init_db([
        ("a", {"kind": "push", "tags": ["x", "y"], "meta": {"ok": True, "note": None}, "n": 7}),
        ("b", {"kind": "pull", "tags": ["y"]}),
    ])
    yield
    db.drop_tables([Event])


def slugs(query):
    return [e.slug for e in query]


def test_item_access_compares_against_json(events):
    assert slugs(by_key("kind", "push")) == ["a"]
    # the right side is wrapped in json(), so a native Python value matches
    assert slugs(Event.select().where(Event.payload["n"] == 7)) == ["a"]


def test_as_text_yields_sql_scalars(events):
    # ->> returns the SQL representation: a JSON number comes back as an int
    assert slugs(Event.select().where(Event.payload["n"].as_text() == 7)) == ["a"]
    assert slugs(Event.select().where(Event.payload["n"].as_text() == "7")) == []


def test_has_key_sees_a_present_null(events):
    # a key whose value is JSON null still counts as present
    assert slugs(Event.select().where(Event.payload["meta"].has_key("note"))) == ["a"]
    assert slugs(Event.select().where(Event.payload["meta"].has_key("missing"))) == []


def test_contains_is_subset_or_array_membership(events):
    assert slugs(Event.select().where(Event.payload.contains({"kind": "push"}))) == ["a"]
    assert slugs(Event.select().where(Event.payload["tags"].contains("x"))) == ["a"]
    # on the root object, contains() looks at keys, never array items
    assert slugs(Event.select().where(Event.payload.contains("x"))) == []


def test_in_place_mutations(events):
    append_tag("a", "z")
    assert Event.get(Event.slug == "a").payload["tags"] == ["x", "y", "z"]
    # a mutator without .where() rewrites every row
    Event.update(payload=Event.payload.update({"seen": True})).execute()
    assert all(e.payload["seen"] is True for e in Event.select())


def test_sqlite_ext_database_is_removed():
    # peewee 4 dropped SqliteExtDatabase; JSON now lives on core SqliteDatabase
    with pytest.raises(ImportError):
        from playhouse.sqlite_ext import SqliteExtDatabase
    assert isinstance(db, SqliteDatabase)
