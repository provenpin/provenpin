from io import BytesIO

from pypdf import PdfReader, PdfWriter

from pdf_tools import (
    make_pdf,
    merge_pdfs,
    page_count,
    read_metadata,
    rotate_page,
    split_pdf,
)


def test_merge_keeps_page_order_and_count():
    merged = merge_pdfs([make_pdf("a", 2), make_pdf("b", 1)])
    reader = PdfReader(merged)
    assert page_count(merged) == 3
    assert reader.pages[0].extract_text() == "a page 1\n"
    assert reader.pages[2].extract_text() == "b page 1\n"


def test_add_page_drops_document_metadata():
    src = make_pdf("a", 1, title="Report A", author="Ann")
    writer = PdfWriter()
    for page in PdfReader(src).pages:
        writer.add_page(page)
    out = BytesIO()
    writer.write(out)
    assert read_metadata(BytesIO(out.getvalue()))["title"] is None


def test_merge_preserves_first_metadata():
    merged = merge_pdfs(
        [make_pdf("a", 1, title="Report A", author="Ann"), make_pdf("b", 1, title="Report B")]
    )
    meta = read_metadata(merged)
    assert meta["title"] == "Report A"
    assert meta["author"] == "Ann"


def test_rotate_accumulates_on_the_page():
    once = rotate_page(make_pdf("a", 1), 0, 90)
    twice = rotate_page(once, 0, 90)
    assert PdfReader(once).pages[0].rotation == 90
    assert PdfReader(twice).pages[0].rotation == 180


def test_split_selects_indices_in_order():
    parts = split_pdf(make_pdf("a", 3), [2, 0])
    reader = PdfReader(parts)
    assert page_count(parts) == 2
    assert reader.pages[0].extract_text() == "a page 3\n"
    assert reader.pages[1].extract_text() == "a page 1\n"


def test_reportlab_defaults_author_to_anonymous():
    meta = read_metadata(make_pdf("a", 1, title="Only Title"))
    assert meta["title"] == "Only Title"
    assert meta["author"] == "anonymous"
