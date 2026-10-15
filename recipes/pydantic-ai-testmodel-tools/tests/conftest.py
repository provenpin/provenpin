import sqlite3

import pytest
from pydantic_ai import models

from agent import Deps

# Belt and braces: any accidental real model request now raises instead of hitting the network.
models.ALLOW_MODEL_REQUESTS = False


@pytest.fixture
def deps():
    # Sync tools run in a worker thread, so the connection must allow cross-thread use.
    db = sqlite3.connect(":memory:", check_same_thread=False)
    db.execute("CREATE TABLE prices (item TEXT PRIMARY KEY, cents INTEGER)")
    db.executemany("INSERT INTO prices VALUES (?, ?)", [("widget", 250), ("gadget", 1000)])
    yield Deps(db=db)
    db.close()
