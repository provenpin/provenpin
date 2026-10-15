from typer.testing import CliRunner
from cli import app, DB

runner = CliRunner()

def setup_function():
    DB.clear()

def test_add_and_list():
    assert runner.invoke(app, ["users", "add", "ada", "--age", "36"]).exit_code == 0
    r = runner.invoke(app, ["users", "list"])
    assert "ada\t36" in r.output

def test_duplicate_exits_1():
    runner.invoke(app, ["users", "add", "ada"])
    assert runner.invoke(app, ["users", "add", "ada"]).exit_code == 1

def test_option_range_validation():
    assert runner.invoke(app, ["users", "add", "bo", "--age", "200"]).exit_code == 2

def test_envvar_and_flag():
    r = runner.invoke(app, ["greet", "--shout"], env={"GREET_NAME": "jp"})
    assert r.output.strip() == "HELLO JP"
