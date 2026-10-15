from __future__ import annotations

import tomlkit
from tomlkit import TOMLDocument


def load(text: str) -> TOMLDocument:
    return tomlkit.parse(text)


def dump(doc: TOMLDocument) -> str:
    return tomlkit.dumps(doc)


def bump_version(doc: TOMLDocument, version: str) -> None:
    doc["project"]["version"] = version


def add_dependency(doc: TOMLDocument, dep: str) -> None:
    doc["project"]["dependencies"].append(dep)


def update_section(doc: TOMLDocument, name: str, values: dict) -> None:
    section = doc.setdefault(name, tomlkit.table())
    for key, value in values.items():
        section[key] = value


def add_note(doc: TOMLDocument, text: str) -> None:
    doc.add(tomlkit.comment(text))
    doc.add(tomlkit.nl())
