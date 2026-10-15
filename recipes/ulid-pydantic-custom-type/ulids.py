import sqlite3
from typing import Annotated, Any

from pydantic import BaseModel, GetCoreSchemaHandler
from pydantic_core import core_schema
from ulid import ULID

CROCKFORD = r"[0-7][0-9A-HJKMNP-TV-Z]{25}"


def _validate(value: Any) -> ULID:
    if isinstance(value, ULID):
        return value
    if isinstance(value, str):
        # ULID.from_str() is case sensitive, so normalize first
        return ULID.from_str(value.strip().upper())
    if isinstance(value, int) and not isinstance(value, bool):
        return ULID.from_int(value)
    if isinstance(value, (bytes, bytearray)) and len(value) == 16:
        return ULID.from_bytes(bytes(value))
    raise ValueError("expected a ULID, a 26 char Crockford string, an int or 16 bytes")


class _UlidType:
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.no_info_plain_validator_function(
            _validate,
            serialization=core_schema.to_string_ser_schema(when_used="json-unless-none"),
            json_schema_input_schema=core_schema.str_schema(
                min_length=26, max_length=26, pattern=CROCKFORD
            ),
        )


Ulid = Annotated[ULID, _UlidType]


class User(BaseModel):
    id: Ulid
    name: str


class UserStore:
    def __init__(self) -> None:
        self.db = sqlite3.connect(":memory:")
        self.db.execute("CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL)")

    def add(self, user: User) -> None:
        self.db.execute("INSERT INTO users VALUES (?, ?)", (str(user.id), user.name))

    def all(self) -> list[User]:
        rows = self.db.execute("SELECT id, name FROM users ORDER BY id").fetchall()
        return [User(id=row_id, name=name) for row_id, name in rows]
