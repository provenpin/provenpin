import marshmallow as ma
import pytest
from marshmallow_oneofschema import OneOfSchema

from schemas import (
    EmailTarget,
    EmailTargetSchema,
    NotificationSchema,
    SmsTarget,
    TargetSchema,
)


def test_load_dispatches_on_kind():
    loaded = NotificationSchema().load(
        {"id": 1, "target": {"kind": "email", "address": "a@b.com"}}
    )
    assert loaded["target"] == EmailTarget("a@b.com")


def test_dump_adds_kind_and_round_trips():
    dumped = NotificationSchema().dump({"id": 2, "target": SmsTarget(number="+15555550100")})
    assert dumped["target"] == {"number": "+15555550100", "kind": "sms"}
    assert NotificationSchema().load(dumped)["target"] == SmsTarget("+15555550100")


def test_unknown_kind_is_reported_on_type_field():
    with pytest.raises(ma.ValidationError) as exc:
        TargetSchema().load({"kind": "carrier-pigeon", "address": "a@b.com"})
    assert exc.value.messages == {"kind": ["Unsupported value: carrier-pigeon"]}


def test_default_get_obj_type_must_match_type_schemas_keys():
    class NoGetObjType(OneOfSchema):
        type_field = "kind"
        type_schemas = TargetSchema.type_schemas

    # the default get_obj_type returns the class name ("EmailTarget"), not the
    # "email" key, and dump silently returns an error tuple instead of raising
    result = NoGetObjType().dump(EmailTarget("a@b.com"))
    assert result == (None, {"_schema": "Unsupported object type: EmailTarget"})


def test_type_field_remove_false_leaks_type_into_subschema():
    class KeepsTypeField(OneOfSchema):
        type_field = "kind"
        type_field_remove = False
        type_schemas = {"email": EmailTargetSchema}

    with pytest.raises(ma.ValidationError) as exc:
        KeepsTypeField().load({"kind": "email", "address": "a@b.com"})
    assert exc.value.messages == {"kind": ["Unknown field."]}


def test_parent_unknown_option_does_not_reach_nested_schema():
    data = {"id": 3, "target": {"kind": "email", "address": "a@b.com", "extra": 1}}
    # unknown=EXCLUDE on the parent is not passed through fields.Nested
    with pytest.raises(ma.ValidationError):
        NotificationSchema().load(data, unknown=ma.EXCLUDE)

    class Tolerant(ma.Schema):
        id = ma.fields.Int(required=True)
        target = ma.fields.Nested(TargetSchema, required=True, unknown=ma.EXCLUDE)

    assert Tolerant().load(data)["target"] == EmailTarget("a@b.com")
