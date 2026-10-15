import csv

from typer.testing import CliRunner

from report import app

runner = CliRunner()

CSV_HEADER = "region,units,revenue\n"


def write_report(tmp_path, name, body):
    path = tmp_path / name
    path.write_text(CSV_HEADER + body, encoding="utf-8")
    return path


def read_csv(path):
    with path.open(newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def test_quoted_commas_survive_roundtrip(tmp_path):
    src = write_report(tmp_path, "a.csv", '"North, East",3,10.00\n')
    out = tmp_path / "agg.csv"
    result = runner.invoke(app, [str(src), "--out", str(out), "--plain"])
    assert result.exit_code == 0
    assert "North, East" in result.stdout
    assert read_csv(out)[0]["region"] == "North, East"


def test_batch_aggregates_across_files(tmp_path):
    a = write_report(tmp_path, "a.csv", "north,3,10.00\n")
    b = write_report(tmp_path, "b.csv", "north,4,2.50\n")
    out = tmp_path / "agg.csv"
    result = runner.invoke(app, [str(a), str(b), "--out", str(out), "--plain"])
    assert result.exit_code == 0
    row = read_csv(out)[0]
    assert row["units"] == "7" and row["revenue"] == "12.50"


def test_csv_numbers_stay_machine_parseable(tmp_path):
    src = write_report(tmp_path, "a.csv", "north,3,1234.50\n")
    out = tmp_path / "agg.csv"
    result = runner.invoke(app, [str(src), "--out", str(out), "--plain"])
    assert "1,234.50" in result.stdout
    row = read_csv(out)[0]
    assert float(row["revenue"]) == 1234.50


def test_markup_in_data_is_escaped(tmp_path):
    src = write_report(tmp_path, "a.csv", '"[red]x[/]",1,1.00\n')
    result = runner.invoke(app, [str(src), "--plain"])
    assert result.exit_code == 0
    assert "[red]x[/]" in result.stdout


def test_color_auto_strips_ansi_when_piped(tmp_path):
    src = write_report(tmp_path, "a.csv", "north,1,1.00\n")
    result = runner.invoke(app, [str(src)])
    assert result.exit_code == 0
    assert "\x1b[" not in result.stdout


def test_missing_source_is_usage_error(tmp_path):
    result = runner.invoke(app, [str(tmp_path / "nope.csv")])
    assert result.exit_code == 2
