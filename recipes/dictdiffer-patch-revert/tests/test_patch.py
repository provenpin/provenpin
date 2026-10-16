from dictdiffer import diff, patch, revert

from dictpatch import apply_patch, make_patch, paths_of, undo_patch

FIRST = {"name": "svc", "replicas": 2, "env": {"DEBUG": "0", "TZ": "UTC"}, "ports": [80]}
SECOND = {"name": "svc", "replicas": 3, "env": {"DEBUG": "1", "TZ": "UTC"}, "ports": [80, 443], "extra": True}


def test_make_patch_lists_nested_changes():
    ops = make_patch(FIRST, SECOND)
    assert ("change", "replicas", (2, 3)) in ops
    assert ("change", "env.DEBUG", ("0", "1")) in ops
    assert ("add", "", [("extra", True)]) in ops


def test_patch_returns_new_dict_and_leaves_base_untouched():
    patched = apply_patch(make_patch(FIRST, SECOND), FIRST)
    assert patched == SECOND
    assert FIRST["replicas"] == 2 and "extra" not in FIRST


def test_patch_then_revert_round_trips():
    ops = make_patch(FIRST, SECOND)
    patched = apply_patch(ops, FIRST)
    assert undo_patch(ops, patched) == FIRST


def test_raw_diff_generator_is_exhausted_by_patch():
    ops = diff(FIRST, SECOND)
    patched = patch(ops, FIRST)
    assert revert(ops, patched) == patched
    assert undo_patch(make_patch(FIRST, SECOND), patched) == FIRST


def test_ignore_matches_dotted_paths_not_key_names():
    patched = apply_patch(make_patch(FIRST, SECOND, ignore={"env.DEBUG"}), FIRST)
    assert patched["env"]["DEBUG"] == "0"
    assert patched["replicas"] == 3


def test_ignore_key_anywhere_via_paths_of():
    before = {"updated_at": 1, "meta": {"updated_at": 2, "size": 1}}
    after = {"updated_at": 10, "meta": {"updated_at": 20, "size": 2}}
    ignore = paths_of(before, "updated_at") | paths_of(after, "updated_at")
    patched = apply_patch(make_patch(before, after, ignore=ignore), before)
    assert patched["meta"]["size"] == 2
    assert patched["updated_at"] == 1 and patched["meta"]["updated_at"] == 2
