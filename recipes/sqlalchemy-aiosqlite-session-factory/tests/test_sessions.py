import pytest
import pytest_asyncio
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from database import Base, make_engine, make_session_factory
from models import User


@pytest_asyncio.fixture
async def session_factory():
    engine = make_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield make_session_factory(engine)
    await engine.dispose()


async def test_insert_then_select(session_factory):
    async with session_factory() as session:
        session.add(User(name="ada"))
        await session.commit()
    async with session_factory() as session:
        user = await session.scalar(select(User).where(User.name == "ada"))
    assert user is not None and user.id == 1


async def test_staticpool_shares_inmemory_db(session_factory):
    async with session_factory() as s1:
        s1.add(User(name="linus"))
        await s1.commit()
    async with session_factory() as s2:
        total = await s2.scalar(select(func.count()).select_from(User))
    assert total == 1


async def test_expire_on_commit_false_keeps_attributes(session_factory):
    async with session_factory() as session:
        user = User(name="grace")
        session.add(user)
        await session.commit()
        # default expire_on_commit=True would trigger a lazy refresh here
        assert user.name == "grace"


async def test_rollback_discards_pending_rows(session_factory):
    async with session_factory() as session:
        session.add(User(name="temp"))
        await session.rollback()
        total = await session.scalar(select(func.count()).select_from(User))
    assert total == 0


async def test_integrity_error_then_session_reusable(session_factory):
    async with session_factory() as session:
        session.add(User(name="dup"))
        await session.commit()
        session.add(User(name="dup"))
        with pytest.raises(IntegrityError):
            await session.commit()
        await session.rollback()
        total = await session.scalar(select(func.count()).select_from(User))
    assert total == 1
