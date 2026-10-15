from datetime import datetime
from enum import Enum

import attrs
from cattrs.preconf.json import make_converter

class Role(Enum):
    ADMIN = "admin"
    USER = "user"

@attrs.define(frozen=True, slots=True)
class Address:
    city: str
    zip: str = "00000"

@attrs.define(slots=True)
class User:
    id: int
    name: str
    role: Role = Role.USER
    created_at: datetime | None = None
    address: Address | None = None
    tags: list[str] = attrs.field(factory=list)

# preconf json adds ISO datetime hooks on top of the stdlib json support
converter = make_converter()

def to_json(user: User) -> str:
    return converter.dumps(user)

def from_json(data: str) -> User:
    return converter.loads(data, User)
