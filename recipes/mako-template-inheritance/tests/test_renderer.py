import pytest
from renderer import build_lookup, render_page


def test_inherits_base_and_renders_def():
    html = render_page("My <Page>", "  hello  ", ["a"])
    assert html.startswith("<!doctype html>")
    assert "<title>My &lt;Page&gt;</title>" in html
    assert "<h1>My &lt;Page&gt;</h1>" in html


def test_escapes_loop_items_by_default():
    html = render_page("t", "s", ["<script>alert(1)</script>", "ok"])
    assert "<li>&lt;script&gt;alert(1)&lt;/script&gt;</li>" in html
    assert "<script>" not in html


def test_inherited_body_is_not_double_escaped():
    html = render_page("t", "s", [])
    assert '<span class="tag">featured</span>' in html
    assert "&lt;span" not in html


def test_trim_and_custom_filter():
    html = render_page("t", "  spaced  ", [])
    assert "<p>spaced</p>" in html
    assert "<footer>BYE!</footer>" in html


def test_undefined_variable_raises():
    template = build_lookup().get_template("page.html")
    with pytest.raises(NameError):
        template.render(subtitle="s", items=[])
