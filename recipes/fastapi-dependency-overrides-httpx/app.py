from __future__ import annotations

import sqlite3
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel


class Todo(BaseModel):
    id: int
    title: str


def create_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("CREATE TABLE todos (id INTEGER PRIMARY KEY, title TEXT)")
    conn.execute("INSERT INTO todos (id, title) VALUES (1, 'write a recipe')")
    conn.commit()
    return conn


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.conn = create_connection()
    try:
        yield
    finally:
        app.state.conn.close()


app = FastAPI(lifespan=lifespan)


def get_conn() -> sqlite3.Connection:
    return app.state.conn


class TodoRepo:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def get(self, todo_id: int) -> Todo | None:
        row = self.conn.execute(
            "SELECT id, title FROM todos WHERE id = ?", (todo_id,)
        ).fetchone()
        return Todo(id=row["id"], title=row["title"]) if row else None


def get_repo(conn: sqlite3.Connection = Depends(get_conn)) -> TodoRepo:
    return TodoRepo(conn)


@app.get("/todos/{todo_id}", response_model=Todo)
def read_todo(todo_id: int, repo: TodoRepo = Depends(get_repo)) -> Todo:
    todo = repo.get(todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="todo not found")
    return todo
