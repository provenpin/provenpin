import ftfy
from ftfy import TextFixerConfig, fix_and_explain, fix_text

KEEP_TYPOGRAPHY = TextFixerConfig(uncurl_quotes=False, unescape_html=False)


def clean(text: str) -> str:
    """Fix mojibake and reduce typographic characters to ASCII."""
    return fix_text(text)


def clean_keep_typography(text: str) -> str:
    """Fix mojibake but keep curly quotes and HTML entities as written."""
    return fix_text(text, config=KEEP_TYPOGRAPHY)


def explain(text: str) -> tuple[str, list[str]]:
    """Return the fixed text plus the labels of the fixers that fired."""
    fixed = fix_and_explain(text)
    return fixed.text, [f"{kind}:{name}" for kind, name in fixed.explanation]
