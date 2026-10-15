import sqlite3
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Request
from pydantic import BaseModel


class NoteIn(BaseModel):
    body: str


def get_db(request: Request) -> sqlite3.Connection:
    return request.app.state.db


DB = Annotated[sqlite3.Connection, Depends(get_db)]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # check_same_thread=False: sync routes run in a worker thread
    app.state.db = sqlite3.connect(":memory:", check_same_thread=False)
    app.state.db.execute("CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT NOT NULL)")
    app.state.db.commit()
    try:
        yield
    finally:
        app.state.db.close()


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    @app.get("/notes/{note_id}")
    def read_note(note_id: int, db: DB):
        row = db.execute("SELECT body FROM notes WHERE id = ?", (note_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "note not found")
        return {"id": note_id, "body": row[0]}

    @app.post("/notes", status_code=201)
    def create_note(note: NoteIn, db: DB):
        cur = db.execute("INSERT INTO notes (body) VALUES (?)", (note.body,))
        db.commit()
        return {"id": cur.lastrowid, "body": note.body}

    return app
