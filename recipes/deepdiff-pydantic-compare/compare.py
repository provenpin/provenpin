from typing import Any

from deepdiff import DeepDiff
from pydantic import BaseModel


def dump(
    model: BaseModel,
    *,
    json_mode: bool = False,
    exclude_none: bool = False,
) -> dict[str, Any]:
    return model.model_dump(
        mode="json" if json_mode else "python",
        exclude_none=exclude_none,
    )


def _as_dict(value: BaseModel | dict[str, Any], json_mode: bool, exclude_none: bool) -> dict[str, Any]:
    if isinstance(value, BaseModel):
        return dump(value, json_mode=json_mode, exclude_none=exclude_none)
    return value


def diff_models(
    left: BaseModel | dict[str, Any],
    right: BaseModel | dict[str, Any],
    *,
    ignore_order: bool = False,
    significant_digits: int | None = None,
    exclude_paths: set[str] | None = None,
    json_mode: bool = False,
    exclude_none: bool = False,
) -> DeepDiff:
    return DeepDiff(
        _as_dict(left, json_mode, exclude_none),
        _as_dict(right, json_mode, exclude_none),
        ignore_order=ignore_order,
        significant_digits=significant_digits,
        exclude_paths=exclude_paths or set(),
    )
