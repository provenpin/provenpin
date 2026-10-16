import jsonpatch
import pytest

from patching import apply, invert, make_patch, read, write


def test_make_patch_and_apply_return_copy():
    before = {"name": "old", "tags": ["a"]}
    after = {"name": "new", "tags": ["a", "b"]}
    patch = make_patch(before, after)
    assert apply(before, patch) == after
    assert before == {"name": "old", "tags": ["a"]}


def test_apply_in_place_mutates_original():
    document = {"name": "old"}
    patch = [{"op": "replace", "path": "/name", "value": "new"}]
    result = apply(document, patch, in_place=True)
    assert result is document
    assert document == {"name": "new"}


def test_invert_round_trips_and_keeps_removed_values():
    before = {"flag": True, "meta": {"tags": ["x", "y"], "note": "keep"}}
    patch = [
        {"op": "replace", "path": "/flag", "value": False},
        {"op": "add", "path": "/meta/tags/1", "value": "z"},
        {"op": "remove", "path": "/meta/note"},
    ]
    after = apply(before, patch)
    inverse = invert(before, patch)
    assert {"op": "add", "path": "/meta/note", "value": "keep"} in inverse
    assert apply(after, inverse) == before


def test_pointer_escapes_and_set_pointer_default_is_in_place():
    document = {"a/b": {"m~n": 1}, "xs": [1, 2]}
    assert read(document, "/a~1b/m~0n") == 1
    write(document, "/xs/-", 3)
    assert document["xs"] == [1, 2, 3]


def test_set_pointer_can_copy():
    document = {"xs": [1, 2]}
    updated = write(document, "/xs/-", 3, in_place=False)
    assert document == {"xs": [1, 2]}
    assert updated == {"xs": [1, 2, 3]}


def test_test_op_failure_and_missing_path_conflict():
    with pytest.raises(jsonpatch.JsonPatchTestFailed):
        apply({"count": 1}, [{"op": "test", "path": "/count", "value": 2}])
    with pytest.raises(jsonpatch.JsonPatchConflict):
        apply({}, [{"op": "replace", "path": "/missing", "value": 1}])
