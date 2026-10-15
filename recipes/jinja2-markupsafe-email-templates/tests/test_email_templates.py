import pytest
from jinja2 import Environment, TemplateError, TemplateNotFound
from jinja2.exceptions import UndefinedError

from email_templates import make_env

def write(tmp_path, name, body):
    (tmp_path / name).write_text(body)

def test_html_autoescapes_user_input(tmp_path):
    write(tmp_path, "welcome.html", "<p>Hi {{ name }}</p>")
    env = make_env(tmp_path)
    out = env.get_template("welcome.html").render(name="<script>x</script>")
    assert out == "<p>Hi &lt;script&gt;x&lt;/script&gt;</p>"

def test_txt_is_not_escaped(tmp_path):
    write(tmp_path, "welcome.txt", "Hi {{ name }}")
    env = make_env(tmp_path)
    assert env.get_template("welcome.txt").render(name="A & B") == "Hi A & B"

def test_filters_return_markup_so_html_is_not_double_escaped(tmp_path):
    write(tmp_path, "receipt.html", "<p>Total {{ cents | money }}</p>\n{{ url | link(label) }}")
    env = make_env(tmp_path)
    out = env.get_template("receipt.html").render(
        cents=12345, url="https://x.test/?a=1&b=2", label="<b>Ann</b>"
    )
    assert "Total $123.45" in out
    assert '<a href="https://x.test/?a=1&amp;b=2">&lt;b&gt;Ann&lt;/b&gt;</a>' in out

def test_strict_undefined_fails_loudly_on_typo(tmp_path):
    write(tmp_path, "welcome.html", "Hi {{ nmae }}")
    env = make_env(tmp_path)
    with pytest.raises(UndefinedError):
        env.get_template("welcome.html").render(name="Ann")

def test_sandbox_blocks_dunder_access(tmp_path):
    write(tmp_path, "evil.txt", "{{ ''.__class__.__mro__ }}")
    env = make_env(tmp_path)
    # The sandbox returns an Undefined for unsafe attributes; StrictUndefined turns that into an error.
    with pytest.raises(TemplateError):
        env.get_template("evil.txt").render()
    # A plain Environment happily walks the object graph.
    assert "str" in Environment().from_string("{{ ''.__class__.__mro__ }}").render()

def test_loader_rejects_path_traversal(tmp_path):
    env = make_env(tmp_path)
    with pytest.raises(TemplateNotFound):
        env.get_template("../secrets.txt")
