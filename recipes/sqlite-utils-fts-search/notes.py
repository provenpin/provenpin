import sqlite_utils

FTS_COLUMNS = ["title", "body"]


def open_db(path=":memory:"):
    return sqlite_utils.Database(path)


def create_notes(db, notes, create_triggers=True):
    table = db["notes"]
    table.insert_all(notes, pk="id")
    table.enable_fts(FTS_COLUMNS, create_triggers=create_triggers)
    return table


def save_note(db, note):
    db["notes"].upsert(note, pk="id")


def search_notes(db, query, quote=False, limit=None):
    return list(
        db["notes"].search(
            query,
            columns=["id", "title"],
            include_rank=True,
            quote=quote,
            limit=limit,
        )
    )
