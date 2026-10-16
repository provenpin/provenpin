import pytest
from voluptuous import All, Coerce, MultipleInvalid, Range, Schema
from config import load_config, to_bool

def test_coerces_env_style_strings():
    cfg = load_config({"host": "api.internal", "workers": "4", "port": "443"})
    assert cfg["workers"] == 4 and cfg["port"] == 443
    assert isinstance(cfg["port"], int)

def test_defaults_are_coerced_too():
    cfg = load_config({"host": "api.internal", "workers": 2})
    assert cfg["port"] == 8080 and isinstance(cfg["port"], int)
    assert cfg["debug"] is False and cfg["log_level"] == "info"

def test_all_runs_stages_in_order():
    schema = Schema({"port": All(Coerce(int), Range(min=1, max=65535))})
    assert schema({"port": "443"})["port"] == 443
    reversed_order = Schema({"port": All(Range(min=1), Coerce(int))})
    with pytest.raises(MultipleInvalid, match="partial ordering"):
        reversed_order({"port": "443"})

def test_naive_coerce_bool_is_a_trap():
    assert Coerce(bool)("false") is True
    assert to_bool("false") is False and to_bool("on") is True

def test_required_and_bounds_are_reported():
    with pytest.raises(MultipleInvalid) as err:
        load_config({"port": "70000"})
    paths = {tuple(e.path) for e in err.value.errors}
    assert ("host",) in paths and ("workers",) in paths and ("port",) in paths

def test_unknown_keys_are_removed():
    cfg = load_config({"host": "h", "workers": 1, "bogus": "x"})
    assert cfg == {"host": "h", "workers": 1, "port": 8080, "debug": False, "log_level": "info"}
