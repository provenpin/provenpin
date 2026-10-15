import contextlib
import io
from dataclasses import dataclass

import pytest
from cyclopts import App
from cyclopts.exceptions import CoercionError, MissingArgumentError

from cli import app


@dataclass
class Result:
    return_value: object = None
    stdout: str = ""
    stderr: str = ""
    error: Exception | None = None

    @property
    def exit_code(self) -> int:
        return 2 if self.error is not None else 0


def invoke(cli: App, tokens: list[str]) -> Result:
    """Run a Cyclopts app offline and capture its streams and return value."""
    out, err = io.StringIO(), io.StringIO()
    result = Result()
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            result.return_value = cli(tokens, exit_on_error=False, result_action="return_value")
    except Exception as exc:  # CycloptsError subclasses
        result.error = exc
    result.stdout, result.stderr = out.getvalue(), err.getvalue()
    return result


def test_annotated_types_are_coerced():
    result = invoke(
        app,
        ["add", "buy milk", "--priority", "high", "--copies", "3", "--tag", "home", "--verbose"],
    )
    assert result.error is None
    assert result.return_value == {
        "title": "buy milk",
        "priority": "high",
        "copies": 3,
        "tags": ["home"],
        "verbose": True,
    }
    assert isinstance(result.return_value["copies"], int)


def test_repeated_option_accumulates_but_commas_do_not_split():
    result = invoke(app, ["add", "x", "--tag", "a,b", "--tag", "c"])
    assert result.return_value["tags"] == ["a,b", "c"]


def test_help_renders_annotated_help_and_choices():
    result = invoke(app, ["add", "--help"])
    assert result.error is None and result.exit_code == 0
    assert "Short task description." in result.stdout
    assert "[choices: low, medium, high]" in result.stdout
    assert "--no-verbose" in result.stdout


def test_missing_required_argument_is_reported_on_stderr():
    result = invoke(app, ["add"])
    assert isinstance(result.error, MissingArgumentError)
    assert result.stdout == ""
    assert "--title" in result.stderr


def test_coercion_errors_are_cyclopts_errors():
    result = invoke(app, ["add", "x", "--priority", "urgent"])
    assert isinstance(result.error, CoercionError)
    assert "low" in result.stderr and "high" in result.stderr


def test_default_app_call_exits_for_production_scripts():
    with pytest.raises(SystemExit) as exc_info:
        app(["add"])  # exit_on_error defaults to True
    assert exc_info.value.code == 2
