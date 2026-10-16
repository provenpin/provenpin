import pytest
import sqlite_utils

from notes import create_notes, open_db, save_note, search_notes

NOTES = [
    {"id": 1, "title": "Intro to Python", "body": "A guide to programming"},
    {"id": 2, "title": "SQLite FTS", "body": "Full text search in SQLite"},
]


def test_insert_and_search():
    db = open_db()
    create_notes(db, NOTES)
    hits = search_notes(db, "python")
    assert [h["id"] for h in hits] == [1]


def test_triggers_keep_index_in_sync():
    db = open_db()
    create_notes(db, NOTES, create_triggers=True)
    save_note(db, {"id": 3, "title": "Async Python", "body": "asyncio notes"})
    assert [h["id"] for h in search_notes(db, "asyncio")] == [3]
    save_note(db, {"id": 3, "title": "Coroutines", "body": "asyncio notes"})
    assert [h["id"] for h in search_notes(db, "coroutines")] == [3]
    assert [h["id"] for h in search_notes(db, "async")] == []


def test_without_triggers_needs_rebuild():
    db = open_db()
    table = create_notes(db, NOTES, create_triggers=False)
    save_note(db, {"id": 4, "title": "Rebuild me", "body": "stale index"})
    assert search_notes(db, "rebuild") == []
    table.rebuild_fts()
    assert [h["id"] for h in search_notes(db, "rebuild")] == [4]


def test_upsert_requires_pk():
    db = open_db()
    db["misc"].insert({"a": 1})
    with pytest.raises(sqlite_utils.db.PrimaryKeyRequired):
        db["misc"].upsert({"a": 2})


def test_search_quotes_fts_syntax():
    db = open_db()
    create_notes(db, [{"id": 1, "title": "C++ tips", "body": "cpp"}])
    with pytest.raises(sqlite_utils.db.OperationalError):
        search_notes(db, "C++")
    assert [h["id"] for h in search_notes(db, "C++", quote=True)] == [1]


def test_rank_orders_best_match_first():
    db = open_db()
    create_notes(
        db,
        [
            {"id": 1, "title": "Python", "body": "once"},
            {"id": 2, "title": "Python Python", "body": "python python python"},
        ],
    )
    hits = search_notes(db, "python")
    assert [h["id"] for h in hits] == [2, 1]
    assert hits[0]["rank"] < hits[1]["rank"]
    assert len(search_notes(db, "python", limit=1)) == 1
