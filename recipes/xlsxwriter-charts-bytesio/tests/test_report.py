import io
import zipfile

import xlsxwriter

from report import build_report, write_report

ROWS = [("alpha", 3), ("beta", 7), ("gamma", 5)]


def xml(blob, path):
    with zipfile.ZipFile(io.BytesIO(blob)) as zf:
        return zf.read(path).decode()


def test_output_is_valid_xlsx_zip():
    blob = build_report(ROWS)
    assert blob[:2] == b"PK"
    with zipfile.ZipFile(io.BytesIO(blob)) as zf:
        parts = zf.namelist()
    assert "xl/workbook.xml" in parts
    assert "xl/charts/chart1.xml" in parts
    assert "xl/drawings/drawing1.xml" in parts


def test_chart_series_references_cells_not_values():
    chart = xml(build_report(ROWS), "xl/charts/chart1.xml")
    assert "<c:barChart>" in chart
    assert "<c:f>Data!$B$2:$B$4</c:f>" in chart
    assert "<c:f>Data!$A$2:$A$4</c:f>" in chart
    assert "Values by name" in chart


def test_sheet_holds_strings_numbers_and_cached_formula():
    blob = build_report(ROWS)
    assert "gamma" in xml(blob, "xl/sharedStrings.xml")
    sheet = xml(blob, "xl/worksheets/sheet1.xml")
    assert "<v>7</v>" in sheet
    assert "<f>SUM(B2:B4)</f>" in sheet
    assert "<v>15</v>" in sheet


def test_stream_must_be_closed_before_reading():
    buf = io.BytesIO()
    wb = xlsxwriter.Workbook(buf, {"in_memory": True})
    wb.add_worksheet().write(0, 0, "draft")
    assert buf.getvalue() == b""
    wb.close()
    assert buf.getvalue()[:2] == b"PK"


def test_read_pointer_sits_at_end_after_close():
    buf = write_report(io.BytesIO(), ROWS)
    assert buf.read() == b""
    buf.seek(0)
    assert "xl/charts/chart1.xml" in zipfile.ZipFile(buf).namelist()
