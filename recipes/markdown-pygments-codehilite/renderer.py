import markdown
from pygments.formatters import HtmlFormatter

EXTENSIONS = ["fenced_code", "codehilite", "toc", "tables"]
EXTENSION_CONFIGS = {
    "codehilite": {"guess_lang": False, "css_class": "codehilite"},
    "toc": {"permalink": False},
}


def make_markdown() -> markdown.Markdown:
    return markdown.Markdown(
        extensions=EXTENSIONS, extension_configs=EXTENSION_CONFIGS
    )


def render(text: str) -> str:
    return make_markdown().convert(text)


def toc_tokens(text: str) -> list[dict]:
    md = make_markdown()
    md.convert(text)
    return md.toc_tokens


def toc_html(text: str) -> str:
    md = make_markdown()
    md.convert(text)
    return md.toc


def pygments_css(style: str = "default", css_class: str = "codehilite") -> str:
    return HtmlFormatter(style=style).get_style_defs(f".{css_class}")
