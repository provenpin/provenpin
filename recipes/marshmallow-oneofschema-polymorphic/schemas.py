from dataclasses import dataclass

import marshmallow as ma
from marshmallow_oneofschema import OneOfSchema


@dataclass
class EmailTarget:
    address: str


@dataclass
class SmsTarget:
    number: str


class EmailTargetSchema(ma.Schema):
    address = ma.fields.Email(required=True)

    @ma.post_load
    def make_target(self, data, **kwargs):
        return EmailTarget(**data)


class SmsTargetSchema(ma.Schema):
    number = ma.fields.Str(required=True)

    @ma.post_load
    def make_target(self, data, **kwargs):
        return SmsTarget(**data)


class TargetSchema(OneOfSchema):
    type_field = "kind"
    type_schemas = {"email": EmailTargetSchema, "sms": SmsTargetSchema}

    def get_obj_type(self, obj):
        return {EmailTarget: "email", SmsTarget: "sms"}[type(obj)]


class NotificationSchema(ma.Schema):
    id = ma.fields.Int(required=True)
    target = ma.fields.Nested(TargetSchema, required=True)
