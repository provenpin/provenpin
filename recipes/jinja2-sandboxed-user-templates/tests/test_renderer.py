import pytest
from jinja2 import UndefinedError
from jinja2.sandbox import SecurityError, SandboxedEnvironment
from renderer import OutputTooLargeError, SafeRenderer


def test_renders_with_allowlisted_globals_and_escapes():
    r = SafeRenderer(allowed_globals={"site": "ProvenPin"})
    out = r.render("Hello {{ name }} on {{ site }}", {"name": "<b>Sam</b>"})
    assert out == "Hello &lt;b&gt;Sam&lt;/b&gt; on ProvenPin"


def test_default_sandbox_silently_hides_unsafe_access():
    # Gotcha: a plain SandboxedEnvironment returns an undefined that prints as
    # "", so unsafe attribute access fails open instead of raising.
    raw = SandboxedEnvironment()
    assert raw.from_string("{{ name.__class__ }}").render(name="x") == ""

    with pytest.raises(SecurityError):
        SafeRenderer().render("{{ name.__class__ }}", {"name": "x"})


def test_str_format_escape_is_neutralized():
    # str.format can walk attributes ("{0.__class__}") and is a classic escape.
    with pytest.raises(SecurityError):
        SafeRenderer().render("{{ '{0.__class__}'.format(name) }}", {"name": "x"})


def test_immutable_sandbox_blocks_mutation_but_base_does_not():
    items = [1, 2]
    with pytest.raises(SecurityError):
        SafeRenderer().render("{{ items.append(3) }}", {"items": items})
    assert items == [1, 2]

    # The plain sandbox happily mutates the caller's list.
    SandboxedEnvironment().from_string("{{ items.append(3) }}").render(items=items)
    assert items == [1, 2, 3]


def test_globals_are_allowlisted_and_range_is_capped():
    r = SafeRenderer()
    with pytest.raises(UndefinedError):
        r.render("{{ lipsum(1) }}")
    with pytest.raises(OverflowError):
        r.render("{{ range(200000)|length }}")
    assert r.render("{{ range(3)|join(',') }}") == "0,1,2"


def test_output_cap_stops_runaway_loop():
    r = SafeRenderer(max_output=1000)
    assert r.render("{% for i in range(3) %}x{% endfor %}") == "xxx"
    with pytest.raises(OutputTooLargeError):
        r.render("{% for i in range(100000) %}x{% endfor %}")
