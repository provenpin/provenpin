from sqlalchemy import ForeignKey, String, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, selectinload

class Base(DeclarativeBase):
    pass

class Author(Base):
    __tablename__ = "authors"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    books: Mapped[list["Book"]] = relationship(back_populates="author", cascade="all, delete-orphan")

class Book(Base):
    __tablename__ = "books"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    author_id: Mapped[int] = mapped_column(ForeignKey("authors.id"))
    author: Mapped[Author] = relationship(back_populates="books")

async def make_sessionmaker(url: str = "sqlite+aiosqlite:///:memory:"):
    engine = create_async_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # expire_on_commit=False avoids lazy-load errors after commit in async code
    return engine, async_sessionmaker(engine, expire_on_commit=False)

async def authors_with_books(session: AsyncSession) -> list[Author]:
    # async sessions cannot lazy-load; eager-load relationships explicitly
    res = await session.scalars(select(Author).options(selectinload(Author.books)).order_by(Author.name))
    return list(res)
