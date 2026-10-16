from datetime import datetime

import attrs
from cattrs.preconf.orjson import make_converter


@attrs.define(frozen=True, slots=True)
class Session:
    id: int
    label: str
    started_at: datetime
    expires_at: datetime
    tags: list[str] = attrs.field(factory=list)


# the orjson preconf passes datetimes straight through to orjson and reads
# them back with datetime.fromisoformat, so RFC 3339 survives the round-trip
converter = make_converter()


def dump(session: Session) -> bytes:
    return converter.dumps(session)


def load(data: bytes | str) -> Session:
    return converter.loads(data, Session)
