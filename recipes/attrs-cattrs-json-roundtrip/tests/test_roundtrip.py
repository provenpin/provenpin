import json
from datetime import datetime, timezone

import cattrs
import pytest
from cattrs.gen import make_dict_unstructure_fn
from cattrs.preconf.json import make_converter

from models import Address, Role, User, converter, from_json, to_json

def make_user() -> User:
    return User(
        id=1,
        name="Ada",
        role=Role.ADMIN,
        created_at=datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc),
        address=Address("London", "N1"),
        tags=["math", "code"],
    )

def test_full_roundtrip_preserves_values():
    user = make_user()
    assert from_json(to_json(user)) == user

def test_bare_converter_output_is_not_json_serializable():
    # a plain Converter keeps datetime objects, so json.dumps fails
    plain = cattrs.Converter()
    with pytest.raises(TypeError):
        json.dumps(plain.unstructure(make_user()))

def test_enum_uses_its_value_by_default():
    assert converter.unstructure(Role.ADMIN) == "admin"
    assert converter.structure("admin", Role) is Role.ADMIN

def test_unknown_keys_are_ignored_unless_forbidden():
    data = {"id": 1, "name": "Ada", "typo": "oops"}
    assert not hasattr(converter.structure(data, User), "typo")
    strict = make_converter(forbid_extra_keys=True)
    with pytest.raises(cattrs.errors.ClassValidationError):
        strict.structure(data, User)

def test_defaults_can_be_omitted_on_the_way_out():
    lean = make_dict_unstructure_fn(User, converter, _cattrs_omit_if_default=True)
    user = User(id=1, name="Ada")
    assert lean(user) == {"id": 1, "name": "Ada"}
    # defaults are restored when the lean payload is structured back
    assert converter.structure(lean(user), User) == user
