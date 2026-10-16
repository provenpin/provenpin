import pytest
from tinydb import Query, TinyDB
from tinydb.middlewares import CachingMiddleware
from tinydb.storages import MemoryStorage

from store import add_user, adults, open_db, persisted_rows, rename


def test_where_query_reads_through_the_cache():
    db = open_db(write_cache=10)
    add_user(db, "ada", 36)
    add_user(db, "bob", 12)
    assert adults(db) == ["ada"]


def test_query_object_update_invalidates_search_cache():
    db = open_db(write_cache=10)
    add_user(db, "ada", 36)
    assert [d["name"] for d in db.search(Query().name == "ada")] == ["ada"]
    assert rename(db, "ada", "grace") == [1]
    assert [d["name"] for d in db.search(Query().name == "ada")] == []
    assert [d["name"] for d in db.search(Query().name == "grace")] == ["grace"]


def test_writes_are_buffered_until_flush():
    db = open_db(write_cache=10)
    add_user(db, "ada", 36)
    assert persisted_rows(db) == 0
    db.storage.flush()
    assert persisted_rows(db) == 1


def test_write_cache_size_flushes_on_its_own():
    db = open_db(write_cache=2)
    add_user(db, "ada", 36)
    assert persisted_rows(db) == 0
    add_user(db, "bob", 12)
    assert persisted_rows(db) == 2


def test_cached_reads_mask_external_writes():
    db = open_db(write_cache=10)
    add_user(db, "ada", 36)
    # Simulate another writer hitting the real storage behind the middleware.
    db.storage.storage.write({"_default": {"7": {"name": "eve", "age": 50}}})
    assert [d["name"] for d in db.all()] == ["ada"]
    db.storage.cache = None
    assert [d["name"] for d in db.all()] == ["eve"]


def test_middleware_needs_the_storage_class_not_an_instance():
    with pytest.raises(TypeError):
        TinyDB(storage=CachingMiddleware(MemoryStorage()))
