import pytest
import pytest_asyncio
from sqlalchemy.exc import IntegrityError, MissingGreenlet, StatementError
from repository import Author, AuthorRepo, Base, make_engine, make_sessionmaker


@pytest_asyncio.fixture
async def engine():
    eng = make_engine()
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest.fixture
def maker(engine):
    return make_sessionmaker(engine)


@pytest.mark.asyncio
async def test_add_and_fetch_books_with_selectinload(maker):
    async with maker() as s:
        repo = AuthorRepo(s)
        author = await repo.add("Ursula")
        await repo.add_book(author.id, "The Dispossessed")
        await s.commit()
    async with maker() as s:
        found = await AuthorRepo(s).get_with_books(author.id)
        assert [b.title for b in found.books] == ["The Dispossessed"]


@pytest.mark.asyncio
async def test_lazy_load_raises_in_async(maker):
    async with maker() as s:
        author = await AuthorRepo(s).add("Octavia")
        await s.commit()
    async with maker() as s:
        loaded = await s.get(Author, author.id)
        # Lazy loading needs IO, which is impossible inside a sync attribute access.
        # SQLAlchemy wraps the MissingGreenlet in a StatementError, so check the original.
        with pytest.raises(StatementError) as info:
            _ = loaded.books
        assert isinstance(info.value.orig, MissingGreenlet)


@pytest.mark.asyncio
async def test_foreign_key_enforced(maker):
    async with maker() as s:
        repo = AuthorRepo(s)
        with pytest.raises(IntegrityError):
            await repo.add_book(999, "Orphan")


@pytest.mark.asyncio
async def test_unique_name_raises(maker):
    async with maker() as s:
        await AuthorRepo(s).add("Dup")
        await s.commit()
    async with maker() as s:
        with pytest.raises(IntegrityError):
            await AuthorRepo(s).add("Dup")


@pytest.mark.asyncio
async def test_rollback_discards_changes(maker):
    async with maker() as s:
        await AuthorRepo(s).add("Ghost")
        await s.rollback()
    async with maker() as s:
        assert await AuthorRepo(s).count() == 0


@pytest.mark.asyncio
async def test_attributes_readable_after_commit(maker):
    async with maker() as s:
        author = await AuthorRepo(s).add("Le Guin")
        await s.commit()
        # expire_on_commit=False: no lazy refresh, so no await is needed here.
        assert author.name == "Le Guin"
