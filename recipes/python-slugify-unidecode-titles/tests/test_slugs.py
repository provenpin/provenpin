from slugs import ascii_slug, unicode_slug, unique_slug


def test_ascii_transliterates_diacritics():
    assert ascii_slug("Café Münster") == "cafe-munster"
    assert ascii_slug("Straße") == "strasse"
    assert ascii_slug("naïve façade") == "naive-facade"


def test_cjk_is_romanized_unless_allow_unicode():
    assert ascii_slug("北京 大学") == "bei-jing-da-xue"
    assert unicode_slug("北京 大学") == "北京-大学"


def test_replacements_run_before_symbols_are_stripped():
    assert ascii_slug("C++ & Python") == "cpp-and-python"


def test_lowercase_false_keeps_only_allow_unicode_scripts():
    assert unicode_slug("Zoë", lowercase=False) == "Zoë"
    assert unicode_slug("Zoë") == "zoë"
    # without allow_unicode the transliteration wins, so the umlaut is gone
    assert ascii_slug("Zoë", max_length=0) == "zoe"


def test_max_length_respects_word_boundary():
    assert ascii_slug("hello world", max_length=7) == "hello-w"
    assert ascii_slug("hello world", max_length=7, word_boundary=True) == "hello"


def test_unique_slug_appends_counter_and_falls_back():
    taken = {"hello-world", "hello-world-2"}
    assert unique_slug("Hello World", taken) == "hello-world-3"
    assert unique_slug("Fresh Title", taken) == "fresh-title"
    assert unique_slug("!!!", taken) == "untitled"
