from __future__ import annotations

from typing import Any

import yaml
from jsonschema import Draft202012Validator, FormatChecker

SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "required": ["name", "port", "released"],
    "additionalProperties": False,
    "properties": {
        "name": {"type": "string", "minLength": 1},
        "port": {"type": "integer", "minimum": 1, "maximum": 65535},
        "released": {"type": "string", "format": "date"},
        "debug": {"type": "boolean"},
        "hosts": {"type": "array", "items": {"type": "string", "format": "ipv4"}},
    },
}


class ConfigError(ValueError):
    pass


class ConfigLoader(yaml.SafeLoader):
    # YAML 1.1 parses unquoted 2024-01-01 into a datetime.date, which would
    # then fail the schema's "type: string". Drop the timestamp resolver so
    # dates stay plain strings for format: date to check.
    yaml_implicit_resolvers = {
        ch: [(tag, rx) for tag, rx in resolvers if tag != "tag:yaml.org,2002:timestamp"]
        for ch, resolvers in yaml.SafeLoader.yaml_implicit_resolvers.items()
    }


def _unique_mapping(loader: ConfigLoader, node: yaml.MappingNode) -> dict[Any, Any]:
    # PyYAML silently keeps the last value for duplicate keys; make it loud.
    loader.flatten_mapping(node)
    pairs = loader.construct_pairs(node)
    keys = [key for key, _ in pairs]
    dupes = sorted({key for key in keys if keys.count(key) > 1})
    if dupes:
        raise ConfigError(f"duplicate config keys: {dupes}")
    return dict(pairs)


ConfigLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _unique_mapping
)

VALIDATOR = Draft202012Validator(SCHEMA, format_checker=FormatChecker())


def load_config(text: str) -> dict[str, Any]:
    try:
        data = yaml.load(text, Loader=ConfigLoader)
    except yaml.YAMLError as exc:
        raise ConfigError(f"invalid YAML: {exc}") from exc
    if data is None:
        raise ConfigError("config is empty")
    if not isinstance(data, dict):
        raise ConfigError("config root must be a mapping")
    errors = sorted(VALIDATOR.iter_errors(data), key=lambda e: list(e.path))
    if errors:
        path = "/".join(str(p) for p in errors[0].path) or "<root>"
        raise ConfigError(f"{path}: {errors[0].message}")
    return data
