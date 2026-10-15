from advanced_alchemy.base import BigIntAuditBase
from advanced_alchemy.extensions.litestar import (
    SQLAlchemyAsyncConfig,
    SQLAlchemyDTO,
    SQLAlchemyDTOConfig,
    SQLAlchemyPlugin,
)
from litestar import Litestar, get, post
from litestar.exceptions import NotFoundException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column


class Author(BigIntAuditBase):
    __tablename__ = "author"

    name: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True)


class AuthorWriteDTO(SQLAlchemyDTO[Author]):
    # Clients may not set server-managed fields.
    config = SQLAlchemyDTOConfig(exclude={"id", "created_at", "updated_at"})


class AuthorReadDTO(SQLAlchemyDTO[Author]):
    config = SQLAlchemyDTOConfig(exclude={"created_at", "updated_at"})


@post("/authors", dto=AuthorWriteDTO, return_dto=AuthorReadDTO, status_code=201)
async def create_author(data: Author, db_session: AsyncSession) -> Author:
    db_session.add(data)
    # Commit explicitly so the row is visible to other requests. Relying on the
    # plugin's commit timing is fragile across versions and response paths.
    await db_session.commit()
    # Reload server-managed columns (id, timestamps) that the commit expired,
    # so the response DTO does not trigger a lazy load in async code.
    await db_session.refresh(data)
    return data


@get("/authors/{author_id:int}", return_dto=AuthorReadDTO)
async def get_author(author_id: int, db_session: AsyncSession) -> Author:
    author = await db_session.get(Author, author_id)
    if author is None:
        raise NotFoundException(f"author {author_id} not found")
    return author


def create_app(url: str) -> Litestar:
    # create_all runs on the app lifespan, so TestClient must be used as a context manager.
    db = SQLAlchemyAsyncConfig(connection_string=url, create_all=True)
    return Litestar(
        route_handlers=[create_author, get_author],
        plugins=[SQLAlchemyPlugin(config=db)],
    )
