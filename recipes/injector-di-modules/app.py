from __future__ import annotations

import sqlite3
from dataclasses import dataclass

from injector import (
    Binder,
    ClassAssistedBuilder,
    Injector,
    Module,
    NoInject,
    inject,
    provider,
    singleton,
)


@dataclass(frozen=True)
class Settings:
    dsn: str = ":memory:"
    prefix: str = "evt"


class Database:
    def __init__(self, dsn: str) -> None:
        self._conn = sqlite3.connect(dsn)
        self._conn.execute(
            "CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, kind TEXT)"
        )

    def add(self, kind: str) -> int:
        cur = self._conn.execute("INSERT INTO events(kind) VALUES (?)", (kind,))
        self._conn.commit()
        return int(cur.lastrowid)

    def count(self) -> int:
        return int(self._conn.execute("SELECT COUNT(*) FROM events").fetchone()[0])


@singleton
class EventStore:
    @inject
    def __init__(self, db: Database) -> None:
        self._db = db

    def record(self, kind: str) -> int:
        return self._db.add(kind)

    def total(self) -> int:
        return self._db.count()


class Sink:
    def __init__(self, prefix: str) -> None:
        self.prefix = prefix
        self.lines: list[str] = []

    def write(self, message: str) -> None:
        self.lines.append(f"{self.prefix}: {message}")


class Report:
    @inject
    def __init__(self, store: EventStore, label: NoInject[str]) -> None:
        self.store = store
        self.label = label

    def render(self) -> str:
        return f"{self.label} ({self.store.total()})"


class AppModule(Module):
    def configure(self, binder: Binder) -> None:
        settings = Settings()
        binder.bind(Settings, to=settings)
        binder.bind(Database, to=Database(settings.dsn))
        binder.bind(EventStore, to=EventStore)

    @provider
    @singleton
    def provide_sink(self, settings: Settings) -> Sink:
        return Sink(prefix=settings.prefix)
