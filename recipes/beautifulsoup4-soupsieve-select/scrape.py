import soupsieve
from bs4 import BeautifulSoup

HTML = """
<!doctype html>
<html><body>
<table id="projects">
  <thead><tr><th>Name</th><th>Owner</th><th>Cost</th><th>Docs</th></tr></thead>
  <tbody>
    <tr data-status="active">
      <td class="name">Apollo</td><td class="owner">Ada</td><td class="cost">10</td>
      <td><a href="/docs/apollo.pdf">spec</a></td>
    </tr>
    <tr data-status="archived">
      <td class="name">Borealis</td><td class="owner">Ada</td><td class="cost">20</td>
      <td><a href="/docs/borealis.html">site</a></td>
    </tr>
    <tr data-status="active">
      <td class="name">Ceres</td><td class="owner">Bo</td><td class="cost">5</td>
      <td><a href="/docs/ceres.pdf">spec</a> <a href="https://ext.example.com/ceres.pdf">mirror</a></td>
    </tr>
  </tbody>
</table>
<a href="/about" data-status="active">About</a>
</body></html>
"""


def parse(html: str = HTML) -> BeautifulSoup:
    return BeautifulSoup(html, "html.parser")


def project_names(soup: BeautifulSoup) -> list[str]:
    return [c.get_text(strip=True) for c in soup.select("table#projects tbody tr td.name")]


def pdf_links(soup: BeautifulSoup) -> list[str]:
    return [a["href"] for a in soup.select('a[href$=".pdf"]')]


def rows_with_pdf(soup: BeautifulSoup) -> list[str]:
    rows = soup.select("tbody tr:has(a[href$='.pdf'])")
    return [r.select_one("td.name").get_text(strip=True) for r in rows]


def active_names(soup: BeautifulSoup) -> list[str]:
    rows = soup.select("tbody tr[data-status=active]")
    return [r.select_one("td.name").get_text(strip=True) for r in rows if soupsieve.match("tr[data-status=active]", r)]
