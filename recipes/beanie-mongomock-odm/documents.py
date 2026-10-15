import asyncio
import contextlib
from collections.abc import AsyncIterator, Callable

from beanie import Document, Indexed, Link, init_beanie
from mongomock.database import Database as MongoMockDatabase
from mongomock_motor import AsyncMongoMockClient

_original_list_collection_names = MongoMockDatabase.list_collection_names


def _list_collection_names(self, *args, **kwargs):
    kwargs.pop("authorizedCollections", None)
    kwargs.pop("nameOnly", None)
    return _original_list_collection_names(self, *args, **kwargs)


MongoMockDatabase.list_collection_names = _list_collection_names


class Author(Document):
    name: str

    class Settings:
        name = "authors"


class Book(Document):
    title: str
    year: int = 0
    isbn: Indexed(str, unique=True)
    author: Link[Author] | None = None

    class Settings:
        name = "books"


@contextlib.asynccontextmanager
async def memory_db() -> AsyncIterator[object]:
    client = AsyncMongoMockClient()
    await init_beanie(database=client["test"], document_models=[Author, Book])
    try:
        yield client["test"]
    finally:
        client.close()


def async_test(fn: Callable) -> Callable:
    def wrapper(*args, **kwargs):
        return asyncio.run(fn(*args, **kwargs))

    return wrapper
