import io

import xlsxwriter


def write_report(buffer, rows, sheet_name="Data"):
    wb = xlsxwriter.Workbook(buffer, {"in_memory": True})
    ws = wb.add_worksheet(sheet_name)

    bold = wb.add_format({"bold": True})
    ws.write_row(0, 0, ["name", "value"], bold)
    for row, (name, value) in enumerate(rows, start=1):
        ws.write_string(row, 0, name)
        ws.write_number(row, 1, value)

    last = len(rows)
    total = sum(value for _, value in rows)
    ws.write_formula(last + 1, 1, f"=SUM(B2:B{last + 1})", None, total)

    chart = wb.add_chart({"type": "column"})
    chart.add_series(
        {
            "name": "values",
            "categories": f"={sheet_name}!$A$2:$A${last + 1}",
            "values": f"={sheet_name}!$B$2:$B${last + 1}",
        }
    )
    chart.set_title({"name": "Values by name"})
    ws.insert_chart("D2", chart)

    wb.close()
    return buffer


def build_report(rows, sheet_name="Data"):
    return write_report(io.BytesIO(), rows, sheet_name).getvalue()
