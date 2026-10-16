from fpdf import FPDF, FontFace


class Report(FPDF):
    """FPDF subclass that stamps a title header and a page-number footer."""

    def __init__(self, title, **kwargs):
        super().__init__(**kwargs)
        self.title = title

    def header(self):
        self.set_font("helvetica", "B", 12)
        self.cell(0, 8, self.title, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")


def build_report(title, rows, repeat_headings=1, alias="{nb}"):
    """Render a table that flows across pages, repeating the heading row."""
    pdf = Report(title)
    pdf.alias_nb_pages(alias)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("helvetica", size=10)
    pdf.add_page()
    with pdf.table(
        headings_style=FontFace(emphasis="BOLD", fill_color=(230, 230, 230)),
        repeat_headings=repeat_headings,
    ) as table:
        table.row(("id", "name", "value"))
        for row in rows:
            table.row(tuple(str(cell) for cell in row))
    return pdf
