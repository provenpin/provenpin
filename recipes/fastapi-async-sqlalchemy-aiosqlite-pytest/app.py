from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

DATABASE_URL = "sqlite+aiosqlite:///./app.db"


class Base(DeclarativeBase):
    pass


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    price_cents: Mapped[int]


engine = create_async_engine(DATABASE_URL)
# expire_on_commit=False keeps attributes loaded after commit, so no implicit
# lazy load (which raises MissingGreenlet in async code) when building responses.
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]


class ItemIn(BaseModel):
    name: str
    price_cents: int


class ItemOut(ItemIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


app = FastAPI()


@app.post("/items", response_model=ItemOut, status_code=201)
async def create_item(data: ItemIn, session: SessionDep):
    item = Item(**data.model_dump())
    session.add(item)
    await session.commit()
    return ItemOut.model_validate(item)


@app.get("/items/{item_id}", response_model=ItemOut)
async def read_item(item_id: int, session: SessionDep):
    item = await session.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="item not found")
    return ItemOut.model_validate(item)
