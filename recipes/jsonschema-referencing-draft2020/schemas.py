from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry
from referencing.jsonschema import DRAFT202012

ADDRESS = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://example.com/schemas/address",
    "type": "object",
    "properties": {
        "street": {"type": "string", "minLength": 1},
        "postcode": {"type": "string", "pattern": r"^[0-9]{5}$"},
    },
    "required": ["street"],
    "unevaluatedProperties": False,
}

PERSON = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://example.com/schemas/person",
    "type": "object",
    "properties": {
        "name": {"type": "string", "minLength": 1},
        "born": {"type": "string", "format": "date"},
        "address": {"$ref": "https://example.com/schemas/address"},
    },
    "required": ["name", "address"],
    "unevaluatedProperties": False,
}

TREE = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://example.com/schemas/tree",
    "$dynamicAnchor": "node",
    "type": "object",
    "properties": {
        "value": {"type": "integer"},
        "children": {"type": "array", "items": {"$dynamicRef": "#node"}},
    },
    "required": ["value"],
    "unevaluatedProperties": False,
}

def build_registry() -> Registry:
    return Registry().with_resources(
        [(s["$id"], DRAFT202012.create_resource(s)) for s in (ADDRESS, PERSON, TREE)]
    )

def errors(schema, instance, formats=False):
    checker = FormatChecker() if formats else None
    validator = Draft202012Validator(schema, registry=build_registry(), format_checker=checker)
    return sorted(validator.iter_errors(instance), key=lambda e: list(e.absolute_path))
