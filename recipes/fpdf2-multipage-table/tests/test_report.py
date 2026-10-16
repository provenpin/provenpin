import re
import zlib

import pytest
from fpdf import FPDF, FPDFException

from report import build_report


def extract_text(pdf: bytes) -> str:
    """Decompress page streams and join the drawn text in document order."""
    streams = []
    for match in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", pdf, re.S):
        try:
            streams.append(zlib.decompress(match.group(1)))
        except zlib.error:
            continue
    content = b"\n".join(streams)
    return "".join(
        m.group(1).decode("latin-1")
        for m in re.finditer(rb"\(((?:\\.|[^\\()])*)\) Tj", content)
    )


def rows(count):
    return [(i, f"item-{i}", i * 3) for i in range(count)]


def test_single_page_numbers_the_pages():
    pdf = build_report("Inventory", rows(3))
    text = extract_text(bytes(pdf.output()))
    assert pdf.pages_count == 1
    assert "Inventory" in text
    assert "Page 1/1" in text
    assert "item-2" in text


def test_table_flows_to_more_pages_and_repeats_headings():
    pdf = build_report("Inventory", rows(80))
    text = extract_text(bytes(pdf.output()))
    assert pdf.pages_count > 1
    # the heading row is re-drawn once per page
    assert text.count("name") == pdf.pages_count
    assert f"Page 1/{pdf.pages_count}" in text
    assert f"Page {pdf.pages_count}/{pdf.pages_count}" in text
    assert "item-79" in text


def test_repeat_headings_zero_draws_heading_once():
    pdf = build_report("Inventory", rows(80), repeat_headings=0)
    text = extract_text(bytes(pdf.output()))
    assert pdf.pages_count > 1
    assert text.count("name") == 1


def test_disabling_the_alias_leaves_the_placeholder():
    pdf = build_report("Inventory", rows(3))
    pdf.alias_nb_pages(None)
    text = extract_text(bytes(pdf.output()))
    assert "{nb}" in text
    assert "Page 1/{nb}" in text


def test_building_a_table_before_a_page_raises():
    pdf = FPDF()
    with pytest.raises(FPDFException, match="add_page"):
        with pdf.table():
            pass


def test_output_returns_pdf_bytes():
    pdf = build_report("Inventory", rows(3))
    out = pdf.output()
    assert isinstance(out, (bytes, bytearray))
    assert bytes(out).startswith(b"%PDF-")
