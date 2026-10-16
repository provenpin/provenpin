import pytest
from boltons.iterutils import PathAccessError, remap

from transform import drop_nones, nested_get, redact_secrets, rename_keys

CONFIG = {
    "service": {"name": "api", "password": "p", "replicas": 3},
    "token": "top-secret",
    "debug": None,
}


def test_redacts_secrets_at_every_depth():
    clean = redact_secrets(CONFIG)
    assert clean["token"] == "***"
    assert clean["service"]["password"] == "***"
    assert clean["service"]["replicas"] == 3


def test_only_literal_false_drops_an_item():
    assert "debug" not in drop_nones(CONFIG)

    # Returning None (or any falsy non-False value) is treated as a (key, value)
    # pair, so default_exit chokes instead of dropping the item.
    def visit(path, key, value):
        return None if key == "debug" else True

    with pytest.raises(TypeError):
        remap(CONFIG, visit)


def test_rename_visits_every_level_and_collisions_lose_data():
    assert rename_keys({"old": 1, "deep": {"old": 2}}, {"old": "new"}) == {
        "new": 1,
        "deep": {"new": 2},
    }
    # remap is post-order; a pre-existing target key is silently overwritten.
    assert rename_keys({"old": 1, "new": 2}, {"old": "new"}) == {"new": 2}


def test_get_path_default_only_covers_missing_paths():
    assert nested_get(CONFIG, ("service", "name")) == "api"
    assert nested_get(CONFIG, ("service", "nope"), default="fallback") == "fallback"
    # A present None is returned as-is; the default does not kick in.
    assert nested_get(CONFIG, ("debug",), default="fallback") is None


def test_dotted_string_path_cannot_address_dotted_keys():
    payload = {"a.b": 1}
    assert nested_get(payload, ("a.b",)) == 1
    with pytest.raises(PathAccessError):
        nested_get(payload, "a.b")


def test_pathaccesserror_is_a_keyerror_and_indexerror():
    with pytest.raises(PathAccessError) as exc:
        nested_get({"a": 5}, "a.b")
    assert isinstance(exc.value, KeyError)
    assert isinstance(exc.value, IndexError)
