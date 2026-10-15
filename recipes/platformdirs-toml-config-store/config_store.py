from __future__ import annotations

from pathlib import Path

import platformdirs
import tomlkit


class ConfigStore:
    """A TOML config that lives in the platform's per-user config directory."""

    def __init__(
        self,
        appname: str = "provenpin",
        filename: str = "config.toml",
        path: Path | None = None,
    ):
        self.path = (
            Path(path) if path is not None else platformdirs.user_config_path(appname) / filename
        )
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> tomlkit.TOMLDocument:
        if not self.path.exists():
            return tomlkit.document()
        return tomlkit.parse(self.path.read_text(encoding="utf-8"))

    def save(self, doc: tomlkit.TOMLDocument) -> None:
        # Write to a sibling first so a crash never leaves a half-written config.
        tmp = self.path.with_name(f"{self.path.name}.tmp")
        tmp.write_text(tomlkit.dumps(doc), encoding="utf-8")
        tmp.replace(self.path)

    def get(self, key: str, default=None):
        node = self.load()
        for part in key.split("."):
            try:
                node = node[part]
            except (KeyError, TypeError):
                return default
        return node

    def set(self, key: str, value) -> tomlkit.TOMLDocument:
        doc = self.load()
        *parents, leaf = key.split(".")
        node = doc
        for part in parents:
            node = node.setdefault(part, tomlkit.table())
        node[leaf] = value
        self.save(doc)
        return doc
