import databases

SCHEMA = [
    "CREATE TABLE IF NOT EXISTS tasks ("
    "id INTEGER PRIMARY KEY, title TEXT NOT NULL UNIQUE, done INTEGER NOT NULL DEFAULT 0"
    ")",
    "CREATE TABLE IF NOT EXISTS done_tasks ("
    "id INTEGER PRIMARY KEY, title TEXT NOT NULL UNIQUE"
    ")",
]


def make_db(url: str = "sqlite+aiosqlite:///tasks.db") -> databases.Database:
    return databases.Database(url)


async def create_schema(db: databases.Database) -> None:
    for statement in SCHEMA:
        await db.execute(statement)


async def add_task(db: databases.Database, title: str) -> int:
    return await db.execute(
        "INSERT INTO tasks (title) VALUES (:title)", {"title": title}
    )


async def add_tasks(db: databases.Database, titles: list[str]) -> None:
    await db.execute_many(
        "INSERT INTO tasks (title) VALUES (:title)", [{"title": t} for t in titles]
    )


async def get_task(db: databases.Database, title: str) -> dict | None:
    row = await db.fetch_one(
        "SELECT id, title, done FROM tasks WHERE title = :title", {"title": title}
    )
    return dict(row) if row is not None else None


async def list_tasks(db: databases.Database) -> list[dict]:
    rows = await db.fetch_all("SELECT id, title, done FROM tasks ORDER BY id")
    return [dict(row) for row in rows]


async def list_archived(db: databases.Database) -> list[str]:
    rows = await db.fetch_all("SELECT title FROM done_tasks ORDER BY id")
    return [row["title"] for row in rows]


async def complete_task(db: databases.Database, title: str) -> int:
    return await db.execute(
        "UPDATE tasks SET done = 1 WHERE title = :title", {"title": title}
    )


async def archive_task(db: databases.Database, title: str) -> None:
    async with db.transaction():
        await db.execute("DELETE FROM tasks WHERE title = :title", {"title": title})
        await db.execute(
            "INSERT INTO done_tasks (title) VALUES (:title)", {"title": title}
        )
