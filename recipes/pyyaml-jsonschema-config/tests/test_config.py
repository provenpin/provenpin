import pytest
from config import ConfigError, load_config

VALID = """
name: api
port: 8080
released: 2024-01-01
hosts: [10.0.0.1, 10.0.0.2]
"""


def test_valid_config_loads():
    cfg = load_config(VALID)
    assert cfg["port"] == 8080
    assert cfg["hosts"] == ["10.0.0.1", "10.0.0.2"]


def test_unquoted_date_stays_a_string():
    assert load_config(VALID)["released"] == "2024-01-01"


def test_bad_date_fails_format_check():
    with pytest.raises(ConfigError, match="is not a 'date'"):
        load_config("name: api\nport: 80\nreleased: 2024-13-40\n")


def test_yaml11_boolean_breaks_string_field():
    with pytest.raises(ConfigError, match="not of type 'string'"):
        load_config("name: no\nport: 80\nreleased: 2024-01-01\n")


def test_unknown_key_is_rejected():
    with pytest.raises(ConfigError, match="Additional properties are not allowed"):
        load_config("name: api\nport: 80\nreleased: 2024-01-01\nlevel: 3\n")


def test_duplicate_keys_are_rejected():
    with pytest.raises(ConfigError, match="duplicate config keys"):
        load_config("name: api\nname: web\nport: 80\nreleased: 2024-01-01\n")
