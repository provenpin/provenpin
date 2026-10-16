from tinydb import Query, TinyDB, where
from tinydb.middlewares import CachingMiddleware
from tinydb.storages import MemoryStorage


def open_db(write_cache: int = 10) -> TinyDB:
    # TinyDB wants the middleware instance, the middleware wants the storage class.
    db = TinyDB(storage=CachingMiddleware(MemoryStorage))
    # WRITE_CACHE_SIZE is a class attribute the middleware reads on every write.
    db.storage.WRITE_CACHE_SIZE = write_cache
    return db


def add_user(db: TinyDB, name: str, age: int) -> int:
    return db.insert({"name": name, "age": age})


def adults(db: TinyDB) -> list[str]:
    return [doc["name"] for doc in db.search(where("age") >= 18)]


def rename(db: TinyDB, old: str, new: str) -> list[int]:
    return db.update({"name": new}, Query().name == old)


def persisted_rows(db: TinyDB) -> int:
    # Reach past the middleware to the real MemoryStorage.
    raw = db.storage.storage.memory or {}
    return len(raw.get("_default", {}))
