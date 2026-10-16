from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

HEADER_BG = colors.HexColor("#1F4E79")
ZEBRA = colors.HexColor("#F2F2F2")


def styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("ReportTitle", parent=base["Title"], fontSize=16, textColor=HEADER_BG),
        "head": ParagraphStyle("ReportHead", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=9, textColor=colors.white),
        "cell": ParagraphStyle("ReportCell", parent=base["BodyText"], fontSize=9, leading=11),
    }


def paragraph(text, style):
    return Paragraph(escape(str(text)), style)


def table_style():
    return TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ZEBRA]),
    ])


def items_table(items, st, col_widths=(8 * cm, 3 * cm)):
    if not items:
        raise ValueError("items must not be empty")
    data = [[paragraph("Item", st["head"]), paragraph("Qty", st["head"])]]
    data += [[paragraph(name, st["cell"]), paragraph(qty, st["cell"])] for name, qty in items]
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(table_style())
    return table


def build_pdf(items, buf=None):
    buf = buf or BytesIO()
    st = styles()
    story = [paragraph("Quarterly report", st["title"]), Spacer(1, 0.4 * cm), items_table(items, st)]
    SimpleDocTemplate(buf, pagesize=A4, title="Quarterly report").build(story)
    return buf.getvalue()
