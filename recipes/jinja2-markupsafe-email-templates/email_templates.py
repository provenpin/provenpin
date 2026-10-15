from pathlib import Path

from jinja2 import FileSystemLoader, StrictUndefined, select_autoescape
from jinja2.sandbox import SandboxedEnvironment
from markupsafe import Markup

def money(cents: int) -> str:
    return f"${cents / 100:,.2f}"

def link(url: str, label: str) -> Markup:
    # Markup.format escapes its arguments; plain str.format would not.
    return Markup('<a href="{}">{}</a>').format(url, label)

def make_env(template_dir: Path) -> SandboxedEnvironment:
    env = SandboxedEnvironment(
        loader=FileSystemLoader(template_dir),
        autoescape=select_autoescape(["html", "xml"]),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
    )
    env.filters["money"] = money
    env.filters["link"] = link
    return env
