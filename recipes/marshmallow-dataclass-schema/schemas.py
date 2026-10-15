from dataclasses import dataclass, field
from datetime import date
from typing import List, Optional

import marshmallow as ma
import marshmallow_dataclass


@dataclass
class Address:
    street: str
    city: str


@dataclass
class Contact:
    email: str = field(metadata={"validate": ma.validate.Email()})
    phone: Optional[str] = None


@dataclass
class User:
    id: int = field(metadata={"data_key": "user_id"})
    name: str = field(metadata={"validate": ma.validate.Length(min=1)})
    joined: date
    address: Address
    contacts: List[Contact] = field(default_factory=list)
    nickname: Optional[str] = None


@dataclass
class UserPatch:
    name: Optional[str] = None
    nickname: Optional[str] = None


class ExcludeUnknown(ma.Schema):
    class Meta:
        unknown = ma.EXCLUDE


UserSchema = marshmallow_dataclass.class_schema(User)
LenientUserSchema = marshmallow_dataclass.class_schema(User, base_schema=ExcludeUnknown)
PatchSchema = marshmallow_dataclass.class_schema(UserPatch)
