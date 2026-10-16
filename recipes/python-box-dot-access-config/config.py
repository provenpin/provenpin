from __future__ import annotations

from box import Box

DEFAULTS: dict = {
    "service": {"name": "api", "port": 8080, "debug": False},
    "db": {"host": "localhost", "port": 5432},
    "features": ["metrics"],
}


def load_config(overrides: dict | None = None, *, frozen: bool = False) -> Box:
    cfg = Box(DEFAULTS, box_dots=True, default_box=True, default_box_attr=None)
    cfg.merge_update(overrides or {})
    if frozen:
        return Box(cfg.to_dict(), box_dots=True, frozen_box=True)
    return cfg


def to_plain(cfg: Box) -> dict:
    return cfg.to_dict()


def to_yaml(cfg: Box) -> str:
    return Box(_lists(cfg.to_dict()), box_dots=True).to_yaml()


def from_yaml(text: str, *, frozen: bool = False) -> Box:
    return Box.from_yaml(text, box_dots=True, frozen_box=frozen)


def to_json(cfg: Box) -> str:
    return cfg.to_json()


def from_json(text: str, *, frozen: bool = False) -> Box:
    return Box.from_json(text, box_dots=True, frozen_box=frozen)


def _lists(value):
    # frozen boxes hold tuples, which dump as !!python/tuple and choke SafeLoader
    if isinstance(value, dict):
        return {k: _lists(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_lists(v) for v in value]
    return value
