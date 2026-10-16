from io import StringIO

import pytest
from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap
from ruamel.yaml.constructor import DuplicateKeyError

from config import ConfigEditor

SAMPLE = """\
# service.yaml - edited by hand
name: my-service     # shown in dashboards
replicas: 3

# networking
network:
  host: "10.0.0.1"
  ports:
    - 80
    - 443
"""


@pytest.fixture
def editor():
    return ConfigEditor()


def test_edit_scalar_keeps_comments_and_order(editor):
    data = editor.load(SAMPLE)
    data["replicas"] = 5
    out = editor.dump(data)
    assert "# service.yaml - edited by hand" in out
    assert "# shown in dashboards" in out
    assert out.index("name:") < out.index("replicas:") < out.index("network:")
    assert "replicas: 5" in out


def test_preserve_quotes(editor):
    data = editor.load(SAMPLE)
    data["replicas"] = 5
    assert '"10.0.0.1"' in editor.dump(data)
    plain = ConfigEditor(preserve_quotes=False)
    assert '"10.0.0.1"' not in plain.dump(plain.load(SAMPLE))


def test_sequence_indent_needs_explicit_config(editor):
    data = editor.load(SAMPLE)
    data["network"]["ports"].append(8080)
    assert "    - 8080\n" in editor.dump(data)

    default = YAML()
    plain = default.load(SAMPLE)
    plain["network"]["ports"].append(8080)
    out = StringIO()
    default.dump(plain, out)
    assert "  - 8080\n" in out.getvalue()


def test_insert_key_at_position_with_comment(editor):
    data = editor.load(SAMPLE)
    editor.add_setting(data, "owner", "platform", after="name", comment="release owner")
    out = editor.dump(data)
    assert "# release owner\nowner: platform" in out
    assert out.index("name:") < out.index("owner:") < out.index("replicas:")
    assert isinstance(data, CommentedMap)


def test_duplicate_keys_are_rejected(editor):
    with pytest.raises(DuplicateKeyError):
        editor.load("a: 1\n# oops\na: 2\n")


def test_safe_loader_is_not_round_trip():
    data = YAML(typ="safe").load(SAMPLE)
    assert not isinstance(data, CommentedMap)
    out = StringIO()
    YAML(typ="safe").dump(data, out)
    assert "# service.yaml - edited by hand" not in out.getvalue()
