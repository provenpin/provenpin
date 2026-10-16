from io import BytesIO

from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def make_pdf(text: str, pages: int = 1, title: str | None = None, author: str | None = None) -> BytesIO:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    if title:
        c.setTitle(title)
    if author:
        c.setAuthor(author)
    for i in range(pages):
        c.drawString(72, 720, f"{text} page {i + 1}")
        c.showPage()
    c.save()
    return _rewind(buf)


def merge_pdfs(pdfs, keep_first_metadata: bool = True) -> BytesIO:
    writer = PdfWriter()
    readers = [PdfReader(_rewind(p)) for p in pdfs]
    for reader in readers:
        for page in reader.pages:
            writer.add_page(page)
    if keep_first_metadata and readers and readers[0].metadata:
        src = readers[0].metadata
        writer.add_metadata({"/Title": src.title or "", "/Author": src.author or ""})
    out = BytesIO()
    writer.write(out)
    return _rewind(out)


def split_pdf(pdf, indices) -> BytesIO:
    reader = PdfReader(_rewind(pdf))
    writer = PdfWriter()
    for i in indices:
        writer.add_page(reader.pages[i])
    out = BytesIO()
    writer.write(out)
    return _rewind(out)


def rotate_page(pdf, index: int, degrees: int) -> BytesIO:
    reader = PdfReader(_rewind(pdf))
    writer = PdfWriter()
    writer.add_page(reader.pages[index])
    writer.pages[0].rotate(degrees)
    out = BytesIO()
    writer.write(out)
    return _rewind(out)


def read_metadata(pdf) -> dict:
    meta = PdfReader(_rewind(pdf)).metadata
    return {"title": meta.title, "author": meta.author} if meta else {"title": None, "author": None}


def page_count(pdf) -> int:
    return len(PdfReader(_rewind(pdf)).pages)


def _rewind(buf: BytesIO) -> BytesIO:
    buf.seek(0)
    return buf
