from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


def make_engine(url: str = "sqlite+aiosqlite:///:memory:"):
    # StaticPool reuses one connection so every session sees the same in-memory db.
    return create_async_engine(
        url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )


def make_session_factory(engine) -> async_sessionmaker[AsyncSession]:
    # expire_on_commit=False avoids implicit IO when touching attributes after commit.
    return async_sessionmaker(engine, expire_on_commit=False)
