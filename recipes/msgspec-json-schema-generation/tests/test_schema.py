import msgspec
import pytest
from models import User, decode_message, deref, message_schema, user_schema


def test_meta_constraints_become_json_schema_keywords():
    schema = user_schema()
    user = deref(schema, schema)
    assert user["properties"]["age"] == {"type": "integer", "minimum": 0, "maximum": 120}
    assert user["properties"]["name"]["minLength"] == 1
    assert user["properties"]["name"]["maxLength"] == 50
    assert user["properties"]["name"]["pattern"] == "^[a-z]+$"


def test_tagged_union_schema_emits_discriminator():
    schema = message_schema()
    assert set(schema["$defs"]) == {"User", "Team"}
    assert schema["discriminator"] == {
        "propertyName": "type",
        "mapping": {"user": "#/$defs/User", "team": "#/$defs/Team"},
    }
    assert all(ref["$ref"].startswith("#/$defs/") for ref in schema["anyOf"])


def test_tagged_union_dispatches_on_tag():
    user = decode_message(b'{"type":"user","name":"bob","age":30}')
    assert isinstance(user, User) and user.age == 30
    team = decode_message(b'{"type":"team","team_name":"core"}')
    assert team.members == []
    with pytest.raises(msgspec.ValidationError):
        decode_message(b'{"type":"nope","name":"bob"}')


def test_missing_tag_ok_lone_but_not_in_union():
    assert msgspec.json.decode(b'{"name":"bob","age":1}', type=User).name == "bob"
    with pytest.raises(msgspec.ValidationError):
        decode_message(b'{"name":"bob","age":1}')


def test_optional_field_is_not_required():
    schema = user_schema()
    user = deref(schema, schema)
    assert user["required"] == ["type", "name", "age"]
    assert user["properties"]["nickname"]["anyOf"] == [{"type": "string"}, {"type": "null"}]
    assert user["properties"]["nickname"]["default"] is None
    assert decode_message(b'{"type":"user","name":"bob","age":1}').nickname is None


def test_decode_enforces_meta_constraints():
    for payload in (
        b'{"type":"user","name":"Bob","age":1}',
        b'{"type":"user","name":"","age":1}',
        b'{"type":"user","name":"bob","age":121}',
        b'{"type":"user","name":"bob","age":"1"}',
    ):
        with pytest.raises(msgspec.ValidationError):
            decode_message(payload)
    # fields absent from the schema are ignored unless forbid_unknown_fields is set
    assert decode_message(b'{"type":"user","name":"bob","age":1,"x":2}').name == "bob"
