from dataclasses import dataclass, field
from datetime import datetime

from dataclasses_json import (
    CatchAll,
    LetterCase,
    Undefined,
    dataclass_json,
)


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class Address:
    street_name: str
    zip_code: str


@dataclass
class Contact:
    # Left undecorated on purpose: LetterCase does not reach nested classes.
    phone_number: str


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.RAISE)
@dataclass
class User:
    user_id: int
    full_name: str
    created_at: datetime
    address: Address
    contact: Contact
    tags: list[str] = field(default_factory=list)


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class Note:
    note_id: int
    body: str


@dataclass_json(letter_case=LetterCase.CAMEL, undefined=Undefined.INCLUDE)
@dataclass
class Webhook:
    event_id: str
    rest: CatchAll = None
