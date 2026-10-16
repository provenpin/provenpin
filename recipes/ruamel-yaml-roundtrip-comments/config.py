from io import StringIO

from ruamel.yaml import YAML


class ConfigEditor:
    """Round-trip YAML editor that keeps comments, quotes and key order."""

    def __init__(self, preserve_quotes: bool = True):
        self.yaml = YAML()
        self.yaml.preserve_quotes = preserve_quotes
        self.yaml.indent(mapping=2, sequence=4, offset=2)

    def load(self, text: str):
        return self.yaml.load(text)

    def dump(self, data) -> str:
        out = StringIO()
        self.yaml.dump(data, out)
        return out.getvalue()

    def add_setting(self, data, key: str, value, after: str, comment: str | None = None):
        data.insert(list(data.keys()).index(after) + 1, key, value)
        if comment is not None:
            data.yaml_set_comment_before_after_key(key, before=comment)
        return data
