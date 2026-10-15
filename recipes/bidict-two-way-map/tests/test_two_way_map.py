import pytest
from bidict import (
    KeyAndValueDuplicationError,
    KeyDuplicationError,
    ValueDuplicationError,
    bidict,
    frozenbidict,
)
from two_way_map import NameRegistry


def test_inverse_lookup_is_live():
    reg = NameRegistry()
    reg.register("alice", 1)
    reg.register("bob", 2)
    assert reg.id_of("alice") == 1
    assert reg.name_of(2) == "bob"
    assert reg._names.inverse == {1: "alice", 2: "bob"}


def test_register_evicts_both_sides():
    reg = NameRegistry()
    reg.register("alice", 1)
    reg.register("alice", 2)
    assert reg.id_of("alice") == 2
    reg.register("carol", 2)
    assert reg.name_of(2) == "carol"
    assert "alice" not in reg._names


def test_duplicate_value_raises_dedicated_error():
    b = bidict({"alice": 1})
    # DuplicationError is not a ValueError subclass, so catch the specific type.
    with pytest.raises(ValueDuplicationError):
        b["bob"] = 1
    assert dict(b) == {"alice": 1}


def test_put_is_stricter_than_setitem():
    b = bidict({"alice": 1})
    with pytest.raises(KeyDuplicationError):
        b.put("alice", 2)
    b["alice"] = 2
    assert b.inverse[2] == "alice"


def test_key_and_value_collision_is_its_own_error():
    b = bidict({"alice": 1, "bob": 2})
    with pytest.raises(KeyAndValueDuplicationError):
        b.put("alice", 2)


def test_frozenbidict_is_hashable_and_immutable():
    f = frozenbidict({"alice": 1})
    assert {f: "ok"}[f] == "ok"
    with pytest.raises(TypeError):
        f["bob"] = 2
