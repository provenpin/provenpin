import pytest
from referencing import Resource
from referencing.exceptions import CannotDetermineSpecification
from referencing.jsonschema import DRAFT202012

from schemas import PERSON, TREE, errors

VALID = {
    "name": "Ada",
    "born": "1815-12-10",
    "address": {"street": "12 Baker St", "postcode": "12345"},
}

def test_valid_document_passes():
    assert errors(PERSON, VALID) == []

def test_ref_constraints_apply_across_resources():
    bad = {**VALID, "address": {"street": "12 Baker St", "postcode": "nope"}}
    (err,) = errors(PERSON, bad)
    assert list(err.absolute_path) == ["address", "postcode"]
    assert err.validator == "pattern"

def test_unevaluated_properties_sees_through_ref():
    person_level = {**VALID, "nickname": "Ada"}
    assert errors(PERSON, person_level)[0].validator == "unevaluatedProperties"
    address_level = {**VALID, "address": {**VALID["address"], "country": "UK"}}
    (err,) = errors(PERSON, address_level)
    assert err.validator == "unevaluatedProperties"

def test_format_is_annotation_only_unless_checker_passed():
    bad = {**VALID, "born": "not-a-date"}
    assert errors(PERSON, bad) == []
    (err,) = errors(PERSON, bad, formats=True)
    assert err.validator == "format" and err.instance == "not-a-date"

def test_dynamic_ref_recurses_into_children():
    doc = {"value": 1, "children": [{"value": 2}, {"value": "x"}]}
    (err,) = errors(TREE, doc)
    assert list(err.absolute_path) == ["children", 1, "value"]

def test_from_contents_needs_schema_or_default():
    with pytest.raises(CannotDetermineSpecification):
        Resource.from_contents({"type": "object"})
    resource = Resource.from_contents({"type": "object"}, default_specification=DRAFT202012)
    assert resource.contents == {"type": "object"}
