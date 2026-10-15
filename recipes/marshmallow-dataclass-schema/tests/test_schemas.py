from datetime import date

import pytest
from marshmallow import ValidationError

from schemas import (
    Address,
    Contact,
    LenientUserSchema,
    PatchSchema,
    User,
    UserPatch,
    UserSchema,
)

RAW = {
    "user_id": 7,
    "name": "Ada",
    "joined": "2024-01-02",
    "address": {"street": "1 Main", "city": "Springfield"},
    "contacts": [{"email": "ada@example.com", "phone": "555"}],
}


def test_load_builds_nested_dataclasses():
    user = UserSchema().load(RAW)
    assert isinstance(user, User)
    assert isinstance(user.address, Address)
    assert isinstance(user.contacts[0], Contact)
    assert user.joined == date(2024, 1, 2)


def test_dump_round_trips_to_primitives():
    user = UserSchema().load(RAW)
    dumped = UserSchema().dump(user)
    assert dumped == {**RAW, "nickname": None}
    assert UserSchema().load(dumped) == user


def test_validation_error_exposes_nested_paths():
    bad = {**RAW, "contacts": [{"email": "not-an-email"}]}
    with pytest.raises(ValidationError) as exc:
        UserSchema().load(bad)
    assert exc.value.messages == {"contacts": {0: {"email": ["Not a valid email address."]}}}


def test_missing_nested_record_is_required():
    with pytest.raises(ValidationError) as exc:
        UserSchema().load({k: v for k, v in RAW.items() if k != "address"})
    assert exc.value.messages == {"address": ["Missing data for required field."]}


def test_unknown_fields_are_rejected_by_default():
    with pytest.raises(ValidationError) as exc:
        UserSchema().load({**RAW, "bogus": True})
    assert exc.value.messages == {"bogus": ["Unknown field."]}
    assert LenientUserSchema().load({**RAW, "bogus": True}).id == 7


def test_partial_load_requires_optional_fields():
    with pytest.raises(TypeError):
        UserSchema(partial=True).load({"user_id": 7, "name": "Ada"})
    assert PatchSchema().load({"name": "Ada"}) == UserPatch(name="Ada")
