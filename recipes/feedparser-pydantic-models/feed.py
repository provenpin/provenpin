import time
from datetime import datetime, timezone

import feedparser
from pydantic import BaseModel, Field, field_validator


def _to_datetime(value):
    if isinstance(value, time.struct_time):
        return datetime(*value[:6], tzinfo=timezone.utc)
    return value


class Entry(BaseModel):
    id: str
    title: str = ""
    link: str | None = None
    published: datetime | None = None
    tags: list[str] = Field(default_factory=list)
    summary: str | None = None
    content: str | None = None

    @field_validator("published", mode="before")
    @classmethod
    def _from_struct_time(cls, value):
        return _to_datetime(value)


class Feed(BaseModel):
    title: str = ""
    link: str | None = None
    updated: datetime | None = None
    entries: list[Entry] = Field(default_factory=list)

    @field_validator("updated", mode="before")
    @classmethod
    def _from_struct_time(cls, value):
        return _to_datetime(value)


def _content(entry) -> str | None:
    blocks = entry.get("content") or []
    return blocks[0].get("value") if blocks else None


def _entry(entry) -> Entry:
    return Entry(
        id=entry.get("id") or entry.get("link") or "",
        title=entry.get("title", ""),
        link=entry.get("link"),
        published=entry.get("published_parsed") or entry.get("updated_parsed"),
        tags=[tag["term"] for tag in entry.get("tags", []) if "term" in tag],
        summary=entry.get("summary"),
        content=_content(entry),
    )


def parse_feed(data: str | bytes) -> Feed:
    parsed = feedparser.parse(data)
    if parsed.bozo and not parsed.entries:
        raise ValueError(f"malformed feed: {parsed.bozo_exception!r}")
    return Feed(
        title=parsed.feed.get("title", ""),
        link=parsed.feed.get("link"),
        updated=parsed.feed.get("updated_parsed"),
        entries=[_entry(entry) for entry in parsed.entries],
    )
