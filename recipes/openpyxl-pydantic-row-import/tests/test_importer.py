from datetime import date
import io

import pytest
from openpyxl import Workbook

from importer import load_products

HEADER = ["sku", "name", "quantity", "price", "added"]


def workbook(rows) -> io.BytesIO:
    wb = Workbook()
    sheet = wb.active
    sheet.append(HEADER)
    for row in rows:
        sheet.append(row)
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def test_parses_row_and_defaults_optional():
    products = load_products(workbook([["A1", "Widget", 3, 9.99, None]]))
    assert products[0].sku == "A1"
    assert products[0].price == 9.99
    assert products[0].added is None


def test_whole_floats_coerce_but_fractions_fail():
    assert load_products(workbook([["A1", "Widget", 3.0, 1.0, None]]))[0].quantity == 3
    with pytest.raises(ValueError, match="row 2"):
        load_products(workbook([["A2", "Widget", 3.5, 1.0, None]]))


def test_strips_whitespace_and_ignores_extra_columns():
    product = load_products(workbook([["  A1 ", " Widget ", 1, 1.0, None, "junk"]]))[0]
    assert (product.sku, product.name) == ("A1", "Widget")


def test_missing_required_cell_is_null_not_empty_string():
    with pytest.raises(ValueError, match="name"):
        load_products(workbook([["A1", None, 1, 1.0, None]]))


def test_error_reports_sheet_row_number():
    rows = [["A1", "ok", 1, 1.0, None], ["A2", "bad", -1, 1.0, None]]
    with pytest.raises(ValueError, match="row 3"):
        load_products(workbook(rows))


def test_excel_date_becomes_python_date():
    products = load_products(workbook([["A1", "Widget", 1, 1.0, date(2026, 1, 2)]]))
    assert products[0].added == date(2026, 1, 2)
