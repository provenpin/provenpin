import tempfile
from pathlib import Path

from piccolo.columns import ForeignKey, Integer, Varchar
from piccolo.engine.sqlite import SQLiteEngine
from piccolo.table import Table

# A real file is required: with path=":memory:" every Piccolo query opens a
# new connection, so each one would see an empty database.
DB_PATH = Path(tempfile.mkdtemp(prefix="piccolo-")) / "app.sqlite"
DB = SQLiteEngine(path=str(DB_PATH))


class Band(Table, db=DB):
    name = Varchar(unique=True)
    popularity = Integer(default=0)


class Album(Table, db=DB):
    name = Varchar()
    band = ForeignKey(references=Band)
