from fixer import clean, clean_keep_typography, explain


def mojibake(text: str) -> str:
    """Reproduce the classic bug: UTF-8 bytes decoded as Latin-1."""
    return text.encode("utf-8").decode("latin-1")


def test_fixes_single_encoded_mojibake():
    assert mojibake("café") == "cafÃ©"
    assert clean(mojibake("café")) == "café"
    assert clean("plain ASCII") == "plain ASCII"


def test_fixes_double_encoded_mojibake():
    assert clean(mojibake(mojibake("café"))) == "café"


def test_uncurls_quotes_by_default():
    # fix_text does more than repair encoding: it also straightens quotes.
    assert clean(mojibake("The “smart” quote")) == 'The "smart" quote'


def test_keep_typography_config_preserves_quotes():
    assert clean_keep_typography("“smart”") == "“smart”"


def test_html_entities_unescaped_by_default():
    assert clean("Tom &amp; Jerry") == "Tom & Jerry"
    assert clean_keep_typography("Tom &amp; Jerry") == "Tom &amp; Jerry"


def test_explain_reports_encoding_steps():
    text, steps = explain(mojibake("café"))
    assert text == "café"
    assert steps == ["encode:latin-1", "decode:utf-8"]
