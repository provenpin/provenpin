import json

import pytest
from typer.testing import CliRunner

from cli import app

runner = CliRunner()
ROWS = [{"name": "alpha", "count": 3}, {"name": "beta", "count": 12}]


@pytest.fixture
def data(tmp_path):
    p = tmp_path / "rows.json"
    p.write_text(json.dumps(ROWS))
    return p


def test_table_plain_has_no_ansi(data):
    result = runner.invoke(app, [str(data), "--plain"])
    assert result.exit_code == 0
    assert "\x1b[" not in result.stdout
    assert "alpha" in result.stdout and "12" in result.stdout


def test_table_lines_fit_80_columns(data):
    result = runner.invoke(app, [str(data), "--plain"])
    assert all(len(line) <= 80 for line in result.stdout.splitlines())


def test_json_stdout_is_pure_json(data):
    result = runner.invoke(app, [str(data), "--json"])
    assert result.exit_code == 0
    assert json.loads(result.stdout) == ROWS


def test_markup_in_data_is_escaped(tmp_path):
    p = tmp_path / "r.json"
    p.write_text(json.dumps([{"name": "[bold red]x[/]", "count": 1}]))
    result = runner.invoke(app, [str(p), "--plain"])
    assert "[bold red]x[/]" in result.stdout


def test_missing_file_is_usage_error(tmp_path):
    result = runner.invoke(app, [str(tmp_path / "nope.json")])
    assert result.exit_code == 2
