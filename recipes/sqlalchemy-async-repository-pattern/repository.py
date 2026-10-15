from sqlalchemy import ForeignKey, String, event
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, selectinload
from sqlalchemy import select
from sqlalchemy.pool import StaticPool


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
    title: Mapped[str] = mapped_column(String(200))
    author_id: Mapped[int] = mapped_column(ForeignKey("authors.id"))
    author: Mapped[Author] = relationship(back_populates="books")


def make_engine(url: str = "sqlite+aiosqlite:///:memory:") -> AsyncEngine:
    # StaticPool keeps one connection, so every session sees the same in-memory database.
    engine = create_async_engine(url, poolclass=StaticPool)

    @event.listens_for(engine.sync_engine, "connect")
    def _enable_fk(dbapi_conn, _record):
        # SQLite ignores foreign keys unless enabled on each connection.
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    return engine


def make_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    # expire_on_commit=False keeps loaded attributes readable after commit,
    # so async code does not trigger implicit IO.
    return async_sessionmaker(engine, expire_on_commit=False)


class AuthorRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add(self, name: str) -> Author:
        author = Author(name=name)
        self.session.add(author)
        await self.session.flush()  # assigns author.id without committing
        return author

    async def add_book(self, author_id: int, title: str) -> Book:
        book = Book(title=title, author_id=author_id)
        self.session.add(book)
        await self.session.flush()
        return book

    async def get_with_books(self, author_id: int) -> Author | None:
        stmt = select(Author).options(selectinload(Author.books)).where(Author.id == author_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def count(self) -> int:
        return len((await self.session.execute(select(Author))).scalars().all())
