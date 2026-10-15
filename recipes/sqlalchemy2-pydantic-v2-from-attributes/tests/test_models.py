import pytest
from pydantic import BaseModel, ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import selectinload, sessionmaker
from sqlalchemy.pool import StaticPool

from models import Author, Base, Book
from schemas import AuthorOut


class PlainAuthor(BaseModel):
    id: int
    name: str


@pytest.fixture
def session_factory():
    engine = create_engine(
        "sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory.begin() as s:
        s.add(Author(name="Ursula", books=[Book(title="A"), Book(title="B")]))
        s.add(Author(name="Solo"))
    yield factory
    engine.dispose()


def test_nested_rows_validate_after_session_closes(session_factory):
    with session_factory() as s:
        author = s.scalars(
            select(Author).where(Author.name == "Ursula").options(selectinload(Author.books))
        ).one()
    out = AuthorOut.model_validate(author)
    assert [b.title for b in out.books] == ["A", "B"]
    assert out.book_count == 2


def test_unloaded_relationship_fails_after_close(session_factory):
    with session_factory() as s:
        author = s.scalars(select(Author).where(Author.name == "Ursula")).one()
    # books was never eager loaded. Validation touches it on a detached row, and
    # Pydantic wraps the DetachedInstanceError in a ValidationError.
    with pytest.raises(ValidationError, match="not bound to a Session"):
        AuthorOut.model_validate(author)


def test_from_attributes_is_opt_in(session_factory):
    with session_factory() as s:
        author = s.scalars(select(Author).where(Author.name == "Solo")).one()
    with pytest.raises(ValidationError):
        PlainAuthor.model_validate(author)
    assert PlainAuthor.model_validate(author, from_attributes=True).name == "Solo"


def test_computed_field_is_output_only(session_factory):
    with session_factory() as s:
        author = s.scalars(
            select(Author).where(Author.name == "Ursula").options(selectinload(Author.books))
        ).one()
    out = AuthorOut.model_validate(author)
    assert out.model_dump()["book_count"] == 2
    # book_count supplied as input is ignored; it is always derived from books
    fake = AuthorOut.model_validate({"id": 1, "name": "x", "books": [], "book_count": 99})
    assert fake.book_count == 0
