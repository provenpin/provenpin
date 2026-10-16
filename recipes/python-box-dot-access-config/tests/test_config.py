import pytest
import yaml
from box import Box, BoxError
from config import from_json, from_yaml, load_config, to_json, to_plain, to_yaml


def test_dot_access_and_box_dots():
    cfg = load_config()
    assert cfg.service.port == 8080
    assert cfg["db.port"] == 5432
    assert type(to_plain(cfg)["db"]) is dict


def test_overrides_deep_merge():
    cfg = load_config({"db": {"port": 6000}, "service": {"debug": True}})
    assert cfg.db.port == 6000
    assert cfg.db.host == "localhost"
    assert cfg.service.debug is True


def test_missing_key_autovivifies():
    cfg = load_config()
    assert cfg.service.timeout is None
    assert "timeout" in to_plain(cfg)["service"]


def test_frozen_rejects_mutation():
    cfg = load_config(frozen=True)
    assert cfg.service.port == 8080
    with pytest.raises(BoxError):
        cfg.service.port = 9999
    assert isinstance(cfg.features, tuple)
    with pytest.raises((AttributeError, TypeError)):
        cfg.features.append("tracing")


def test_yaml_and_json_roundtrip():
    cfg = load_config({"db": {"port": 6000}})
    assert from_yaml(to_yaml(cfg)) == cfg
    assert from_json(to_json(cfg)) == cfg
    assert isinstance(from_json(to_json(cfg)).db, Box)


def test_frozen_box_dumps_unsafe_yaml():
    frozen = load_config(frozen=True)
    assert "!!python/tuple" in frozen.to_yaml()
    with pytest.raises(yaml.YAMLError):
        from_yaml(frozen.to_yaml())
    assert from_yaml(to_yaml(frozen)) == load_config()
