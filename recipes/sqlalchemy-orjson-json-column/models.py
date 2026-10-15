import orjson
from sqlalchemy import JSON, create_engine
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def dumps(value) -> str:
    # orjson.dumps returns bytes, but json_serializer must hand back str so the
    # column keeps TEXT affinity and DB side json_extract sees real JSON.
    return orjson.dumps(value).decode("utf-8")


def make_engine(url: str, **kwargs):
    return create_engine(
        url,
        json_serializer=dumps,
        json_deserializer=orjson.loads,
        **kwargs,
    )


class Base(DeclarativeBase):
    pass


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    payload: Mapped[dict] = mapped_column(MutableDict.as_mutable(JSON))
    tags: Mapped[list[str]] = mapped_column(MutableList.as_mutable(JSON))
