import pytest
from beanie import Link, PydanticObjectId
from pymongo.errors import DuplicateKeyError

from documents import Author, Book, async_test, memory_db


@async_test
async def test_insert_and_get_roundtrip():
    async with memory_db() as db:
        book = Book(title="Dune", year=1965, isbn="9780441013593")
        await book.insert()
        assert isinstance(book.id, PydanticObjectId)
        fetched = await Book.get(book.id)
        assert fetched is not None and fetched.title == "Dune"
        assert await db["books"].count_documents({}) == 1


@async_test
async def test_query_operators_and_sort():
    async with memory_db() as db:
        await Book(title="A", year=1999, isbn="1").insert()
        await Book(title="B", year=2020, isbn="2").insert()
        await Book(title="C", year=2024, isbn="3").insert()
        recent = await Book.find(Book.year >= 2000).sort(-Book.year).to_list()
        assert [b.title for b in recent] == ["C", "B"]


@async_test
async def test_unique_index_is_enforced():
    async with memory_db() as db:
        await Book(title="A", isbn="dup").insert()
        with pytest.raises(DuplicateKeyError):
            await Book(title="B", isbn="dup").insert()


@async_test
async def test_save_and_bulk_update():
    async with memory_db() as db:
        book = Book(title="Old", year=2001, isbn="x")
        await book.insert()
        book.title = "New"
        await book.save()
        assert (await Book.get(book.id)).title == "New"
        result = await Book.find(Book.year >= 2000).update({"$set": {"year": 2002}})
        assert result.modified_count == 1


@async_test
async def test_links_need_manual_resolution():
    async with memory_db() as db:
        author = Author(name="Frank")
        await author.insert()
        book = Book(title="Dune", isbn="978", author=author)
        await book.insert()
        stored = await Book.get(book.id)
        assert isinstance(stored.author, Link)
        resolved = await Author.get(stored.author.ref.id)
        assert resolved.name == "Frank"


@async_test
async def test_delete_and_count():
    async with memory_db() as db:
        books = [Book(title=f"t{i}", isbn=str(i)) for i in range(3)]
        for b in books:
            await b.insert()
        await books[0].delete()
        assert await Book.count() == 2
