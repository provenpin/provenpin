import pytest
import soupsieve
from bs4 import BeautifulSoup

from scrape import active_names, parse, pdf_links, project_names, rows_with_pdf


def test_extracts_table_cells():
    assert project_names(parse()) == ["Apollo", "Borealis", "Ceres"]


def test_pdf_links_use_attribute_suffix():
    assert pdf_links(parse()) == [
        "/docs/apollo.pdf",
        "/docs/ceres.pdf",
        "https://ext.example.com/ceres.pdf",
    ]


def test_comma_selector_keeps_document_order():
    classes = [c["class"][0] for c in parse().select("td.cost, td.name")]
    assert classes == ["name", "cost", "name", "cost", "name", "cost"]


def test_has_finds_rows_with_pdf():
    assert rows_with_pdf(parse()) == ["Apollo", "Ceres"]
    assert active_names(parse()) == ["Apollo", "Ceres"]


def test_data_attr_is_case_sensitive_unless_flag():
    soup = parse()
    assert len(soup.select("tbody tr[data-status=ACTIVE]")) == 0
    assert len(soup.select("tbody tr[data-status=active i]")) == 2
    row = soup.select_one("tbody tr")
    assert soupsieve.match("tr[data-status=active]", row)
    assert not soupsieve.match("tr[data-status=archived]", row)


def test_html_parser_does_not_insert_tbody():
    soup = BeautifulSoup("<table><tr><td>x</td></tr></table>", "html.parser")
    assert len(soup.select("table tr")) == 1
    assert soup.select("table > tbody > tr") == []


def test_missing_attribute_raises_but_get_is_safe():
    cell = parse().select_one("td.name")
    assert cell.get("href") is None
    with pytest.raises(KeyError):
        _ = cell["href"]
