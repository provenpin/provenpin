import bleach
from markupsafe import Markup

from sanitizer import autolink, render_card, sanitize, sanitize_strict


def test_disallowed_tags_are_escaped_by_default():
    out = sanitize("<b>hi</b> <script>alert(1)</script>")
    assert "<b>hi</b>" in out
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in out
    assert "<script>" not in out


def test_strip_true_drops_tags_and_comments():
    assert sanitize_strict("a<!-- secret --><b>hi</b>") == "ahi"


def test_javascript_urls_and_event_handlers_are_dropped():
    out = sanitize('<a href="javascript:alert(1)" onclick="steal()">x</a>')
    assert out == "<a>x</a>"


def test_plain_bleach_output_is_double_escaped_by_markup_format():
    cleaned = sanitize("<b>hi</b>")
    assert isinstance(cleaned, str) and not isinstance(cleaned, Markup)
    template = Markup("<div>{}</div>")
    assert template.format(cleaned) == "<div>&lt;b&gt;hi&lt;/b&gt;</div>"
    assert template.format(Markup(cleaned)) == "<div><b>hi</b></div>"


def test_render_card_escapes_title_but_trusts_sanitized_body():
    out = render_card("<script>alert(1)</script>", "hello <em>world</em> <script>x</script>")
    assert isinstance(out, Markup)
    assert out.startswith('<article class="card"><h1>&lt;script&gt;alert(1)&lt;/script&gt;</h1>')
    assert "<em>world</em>" in out
    assert "<script>" not in out


def test_linkify_alone_does_not_sanitize_so_clean_first():
    assert "<script>" in bleach.linkify("<script>x</script> https://example.com")
    out = autolink("<script>x</script> https://example.com")
    assert "<script>" not in out
    assert '<a href="https://example.com" rel="nofollow">' in out
