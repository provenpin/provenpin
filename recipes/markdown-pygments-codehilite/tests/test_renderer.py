from renderer import make_markdown, pygments_css, render, toc_html, toc_tokens


def test_fenced_python_is_highlighted():
    html = render("```python\ndef add(x, y):\n    return x + y\n```")
    assert 'class="codehilite"' in html
    assert '<span class="k">def</span>' in html


def test_unlabeled_fence_is_not_guessed():
    html = render("```\nclass Foo:\n    bar = 1\n```")
    assert 'class="codehilite"' in html
    assert 'class="k"' not in html


def test_toc_tokens_are_nested_and_slugified():
    tokens = toc_tokens("# Title\n## Child Section\n### Deep\n## Sibling")
    assert tokens[0]["id"] == "title"
    children = tokens[0]["children"]
    assert [c["id"] for c in children] == ["child-section", "sibling"]
    assert children[0]["children"][0]["level"] == 3
    assert toc_html("# Title").count("<li>") == 1


def test_reusing_instance_resets_toc():
    md = make_markdown()
    md.convert("# One")
    md.convert("# Two")
    assert [t["id"] for t in md.toc_tokens] == ["two"]


def test_tables_and_code_are_escaped():
    html = render("| a | b |\n|---|---|\n| 1 | 2 |\n\n```\n<script>alert(1)</script>\n```")
    assert "<table>" in html
    assert "<script>" not in html
    assert "&lt;script&gt;" in html


def test_pygments_css_prefix_matches_the_css_class():
    assert ".codehilite .k" in pygments_css()
    assert ".highlight .k" in pygments_css(css_class="highlight")
    assert ".codehilite .k" not in pygments_css(css_class="highlight")
