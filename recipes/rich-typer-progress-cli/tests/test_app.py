import re

from typer.testing import CliRunner

from app import app, render_table

runner = CliRunner()
# CI runners (GITHUB_ACTIONS, FORCE_COLOR) make rich emit ANSI styles; strip them before matching.
ANSI = re.compile(r"\x1b\[[0-9;]*m")


def test_run_renders_summary_table():
    result = runner.invoke(app, ["1", "2", "3"])
    assert result.exit_code == 0
    assert "Batch summary" in result.stdout
    assert "9" in result.stdout


def test_transient_progress_leaves_no_trace():
    result = runner.invoke(app, ["1", "2"])
    assert result.exit_code == 0
    assert "squaring" not in result.stdout


def test_quiet_keeps_table_and_skips_progress():
    result = runner.invoke(app, ["-q", "4", "5"])
    assert result.exit_code == 0
    assert "25" in result.stdout
    assert "squaring" not in result.stdout


def test_invalid_value_exits_with_code_2():
    result = runner.invoke(app, ["nope"])
    assert result.exit_code == 2
    assert "is not a valid int" in result.output


def test_help_is_rendered_by_rich():
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    plain = ANSI.sub("", result.stdout)
    assert "Arguments" in plain
    assert "\u256d\u2500 Arguments" in plain


def test_ascii_box_is_deterministic():
    text = render_table([(2, 4), (10, 100)], ascii_only=True)
    assert "|     2 |      4 |" in text
    assert "\u250f" not in text and "\u2500" not in text
