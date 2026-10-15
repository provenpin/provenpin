import bleach
from markupsafe import Markup

ALLOWED_TAGS = ["a", "b", "code", "em", "i", "li", "ol", "p", "strong", "ul"]
ALLOWED_ATTRS = {"a": ["href", "title"]}
ALLOWED_PROTOCOLS = ["http", "https", "mailto"]


def sanitize(html: str) -> str:
    # strip=False escapes disallowed tags, strip=True deletes them.
    return bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        strip=False,
        strip_comments=True,
    )


def sanitize_strict(html: str) -> str:
    return bleach.clean(html, tags=[], attributes={}, protocols=[], strip=True)


def safe(html: str) -> Markup:
    # bleach always returns a plain str, so mark it safe AFTER cleaning.
    return Markup(sanitize(html))


def render_card(title: str, body_html: str) -> Markup:
    template = Markup('<article class="card"><h1>{}</h1><div>{}</div></article>')
    # Markup.format escapes plain args but leaves Markup args alone.
    return template.format(title, safe(body_html))


def autolink(text: str) -> Markup:
    # linkify alone does NOT sanitize, so clean first to avoid passing scripts through.
    return Markup(bleach.linkify(sanitize_strict(text)))
