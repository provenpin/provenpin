from io import BytesIO

import pytest
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Table, TableStyle

from report import build_pdf, items_table, paragraph, styles, table_style


def test_build_pdf_emits_a_valid_document():
    pdf = build_pdf([("Widget", 3), ("Gadget", 7)])
    assert pdf.startswith(b"%PDF-")
    assert b"%%EOF" in pdf[-64:]


def test_paragraph_escapes_markup_so_ampersands_survive():
    st = styles()
    assert paragraph("AT&T", st["cell"]).getPlainText() == "AT&T"
    assert paragraph("<b>bold</b>", st["cell"]).getPlainText() == "<b>bold</b>"
    raw = Paragraph("AT&T", st["cell"]).getPlainText()
    assert raw == "AT&T;"


def test_empty_items_are_rejected():
    with pytest.raises(ValueError):
        items_table([], styles())


def test_paragraph_cells_wrap_while_plain_strings_overflow():
    st = styles()
    long_text = "lorem ipsum " * 20
    wrapped = Table([[Paragraph(long_text, st["cell"])]], colWidths=[4 * cm])
    wrapped.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.grey)]))
    plain = Table([[long_text]], colWidths=[4 * cm])
    assert wrapped.wrap(4 * cm, 100 * cm)[1] > plain.wrap(4 * cm, 100 * cm)[1]


def test_large_table_splits_and_repeats_the_header():
    table = items_table([(f"Item {i}", i) for i in range(200)], styles())
    assert table.repeatRows == 1
    buf = BytesIO()
    doc = SimpleDocTemplate(buf)
    doc.build([table])
    assert doc.page > 1


def test_table_style_keeps_the_header_out_of_the_zebra_rows():
    commands = table_style().getCommands()
    zebra = next(c for c in commands if c[0] == "ROWBACKGROUNDS")
    header = next(c for c in commands if c[0] == "BACKGROUND" and c[2] == (-1, 0))
    assert zebra[1] == (0, 1)
    assert header[3] == colors.HexColor("#1F4E79")
