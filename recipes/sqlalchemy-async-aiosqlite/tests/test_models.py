import pytest
import pytest_asyncio
from sqlalchemy.exc import IntegrityError
from models import Author, Book, authors_with_books, make_sessionmaker

@pytest_asyncio.fixture
async def Session():
    engine, sm = await make_sessionmaker()
    yield sm
    await engine.dispose()

@pytest.mark.asyncio
async def test_create_and_eager_load(Session):
    async with Session() as s:
        s.add(Author(name="Ada", books=[Book(title="Notes"), Book(title="Engine")]))
        await s.commit()
    async with Session() as s:
        [a] = await authors_with_books(s)
        assert sorted(b.title for b in a.books) == ["Engine", "Notes"]

@pytest.mark.asyncio
async def test_unique_violation_rolls_back(Session):
    async with Session() as s:
        s.add(Author(name="Bo"))
        await s.commit()
        s.add(Author(name="Bo"))
        with pytest.raises(IntegrityError):
            await s.commit()
        await s.rollback()
        assert len(await authors_with_books(s)) == 1
