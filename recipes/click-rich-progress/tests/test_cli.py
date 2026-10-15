import io

import click
from click.testing import CliRunner
from rich.console import Console

from cli import main, run_batch


def test_cli_transforms_items():
    result = CliRunner().invoke(main, ["Hello World", " Foo Bar "], env={"FORCE_COLOR": ""})
    assert result.exit_code == 0
    assert "hello-world" in click.unstyle(result.output)
    assert "foo-bar" in click.unstyle(result.output)
    assert "done 2 items" in click.unstyle(result.output)


def test_non_terminal_output_stays_plain():
    result = CliRunner().invoke(main, ["A B"], env={"FORCE_COLOR": ""})
    assert "\x1b[" not in result.output
    assert "done 1 items" in result.output


def test_ansi_codes_are_stripped_with_click_unstyle():
    buf = io.StringIO()
    console = Console(file=buf, force_terminal=True, color_system="standard", width=40)
    run_batch(["A B"], console, transient=False)
    assert "\x1b[" in buf.getvalue()
    assert "1/1" in click.unstyle(buf.getvalue())


def test_transient_erases_the_bar():
    buf = io.StringIO()
    console = Console(file=buf, force_terminal=False, width=40)
    run_batch(["a b"], console, transient=True)
    assert "1/1" not in buf.getvalue()


def test_non_transient_keeps_the_bar():
    buf = io.StringIO()
    console = Console(file=buf, force_terminal=False, width=40)
    run_batch(["a b", "c d"], console, transient=False)
    assert "2/2" in buf.getvalue()


def test_bad_item_raises_and_stops_cleanly():
    result = CliRunner().invoke(main, ["ok", "  "], env={"FORCE_COLOR": ""})
    assert result.exit_code != 0
    assert isinstance(result.exception, ValueError)
    assert "done" not in click.unstyle(result.output)
