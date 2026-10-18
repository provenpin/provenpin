from typing import Any, Callable

import jsonpath_ng.ext as jp

CATALOG: dict[str, Any] = {
    "store": {
        "book": [
            {"title": "Refactoring", "price": 30, "tags": ["code"]},
            {"title": "DDIA", "price": 45, "tags": ["code", "data"]},
            {"title": "Novel", "price": 10},
        ],
        "bicycle": {"color": "red", "price": 120},
    },
    "users": [
        {"name": "ada", "active": True},
        {"name": "bob", "active": False},
    ],
}


def query(data: Any, expr: str) -> list[Any]:
    return [match.value for match in jp.parse(expr).find(data)]


def paths(data: Any, expr: str) -> list[str]:
    return [str(match.full_path) for match in jp.parse(expr).find(data)]


def transform(data: Any, expr: str, fn: Callable[[Any, Any, str], Any]) -> Any:
    # update callbacks receive (value, parent, field), not just the value
    jp.parse(expr).update(data, fn)
    return data


def drop_where(data: Any, expr: str, predicate: Callable[[Any], bool]) -> Any:
    # filter mutates the container in place and removes matching entries
    jp.parse(expr).filter(predicate, data)
    return data


def set_default(data: Any, expr: str, value: Any) -> Any:
    jp.parse(expr).update_or_create(data, value)
    return data
