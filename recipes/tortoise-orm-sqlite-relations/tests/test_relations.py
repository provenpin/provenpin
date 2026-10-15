import pytest
import pytest_asyncio
from tortoise import Tortoise
from tortoise.exceptions import IntegrityError
from tortoise.functions import Count
from models import Author, Book, Tag


@pytest_asyncio.fixture(autouse=True)
async def db():
    await Tortoise.init(db_url="sqlite://:memory:", modules={"models": ["models"]})
    await Tortoise.generate_schemas()
    yield
    await Tortoise.close_connections()


async def make_author(name, *books):
    author = await Author.create(name=name)
    for title, rating in books:
        await Book.create(title=title, rating=rating, author=author)
    return author


async def test_select_related_loads_fk():
    await make_author("ada", ("A", 5))
    book = await Book.get(title="A").select_related("author")
    assert book.author.name == "ada"


async def test_prefetch_reverse_relation():
    await make_author("ada", ("A", 5), ("B", 3))
    author = await Author.get(name="ada").prefetch_related("books")
    assert sorted(b.title for b in author.books) == ["A", "B"]


async def test_reverse_filter_returns_duplicate_rows():
    await make_author("ada", ("A", 9), ("B", 8))
    dupes = await Author.filter(books__rating__gte=8)
    assert len(dupes) == 2
    unique = await Author.filter(books__rating__gte=8).distinct()
    assert [a.name for a in unique] == ["ada"]


async def test_m2m_add_and_filter():
    await make_author("ada", ("A", 5))
    book = await Book.get(title="A")
    tag = await Tag.create(name="python")
    await book.tags.add(tag)
    tagged = await Tag.get(name="python").prefetch_related("books")
    assert [b.title for b in tagged.books] == ["A"]
    assert await Book.filter(tags__name="python").count() == 1


async def test_annotate_count_books():
    await make_author("ada", ("A", 5), ("B", 3))
    await make_author("bob", ("C", 4))
    rows = await Author.annotate(n=Count("books")).order_by("-n", "name").values("name", "n")
    assert rows == [{"name": "ada", "n": 2}, {"name": "bob", "n": 1}]


async def test_unique_name_raises_integrity_error():
    await Author.create(name="ada")
    with pytest.raises(IntegrityError):
        await Author.create(name="ada")
