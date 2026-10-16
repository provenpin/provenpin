import json
from datetime import datetime, timezone

import pytest
from dataclasses_json.undefined import UndefinedParameterError

from models import Address, Contact, Note, User, Webhook


def make_user() -> User:
    return User(
        user_id=1,
        full_name="Ada Lovelace",
        created_at=datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc),
        address=Address("Main St", "N1 1AA"),
        contact=Contact("555-0100"),
        tags=["math"],
    )


def test_camel_case_keys_and_aware_roundtrip():
    user = make_user()
    payload = json.loads(user.to_json())
    assert set(payload) == {"userId", "fullName", "createdAt", "address", "contact", "tags"}
    assert user.to_dict()["address"] == {"streetName": "Main St", "zipCode": "N1 1AA"}
    assert User.from_json(user.to_json()) == user


def test_undecorated_nested_class_keeps_snake_case():
    payload = json.loads(make_user().to_json())
    assert payload["contact"] == {"phone_number": "555-0100"}


def test_datetime_is_encoded_as_epoch_seconds():
    payload = json.loads(make_user().to_json())
    assert isinstance(payload["createdAt"], float)
    with pytest.raises(TypeError):
        User.from_dict({**payload, "createdAt": "2026-01-02T03:04:05+00:00"})


def test_naive_datetime_comes_back_timezone_aware():
    user = make_user()
    user.created_at = datetime(2026, 1, 2, 3, 4, 5)
    restored = User.from_json(user.to_json())
    assert restored.created_at.tzinfo is not None
    assert restored != user


def test_undefined_keys_are_ignored_or_raise():
    assert Note.from_dict({"noteId": 1, "body": "hi", "typo": True}).body == "hi"
    with pytest.raises(UndefinedParameterError):
        User.from_dict({**json.loads(make_user().to_json()), "typo": True})


def test_catch_all_collects_extras():
    hook = Webhook.from_dict({"eventId": "e1", "source": "github", "attempt": 2})
    assert hook.rest == {"source": "github", "attempt": 2}
    assert json.loads(hook.to_json()) == {"eventId": "e1", "source": "github", "attempt": 2}
