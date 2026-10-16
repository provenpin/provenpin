from rapidfuzz import fuzz, process, utils
from matcher import best_match, match_normalized, match_reordered, closest

CHOICES = ["New York", "Newark", "Boston"]


def test_below_cutoff_returns_none():
    # extractOne yields None (not a zero score) once the cutoff is missed
    assert best_match("zzzz", CHOICES, cutoff=70) is None
    assert best_match("New York", CHOICES)["choice"] == "New York"


def test_wratio_beats_ratio_on_substring():
    # WRatio falls back to partial matching, so the long candidate wins
    assert fuzz.ratio("New York", "New York City") < fuzz.WRatio("New York", "New York City")
    assert best_match("New York", ["New York City"])["score"] == 90.0


def test_default_process_normalizes_input():
    # punctuation and case drop the raw score; the processor fixes it
    assert fuzz.WRatio("  new york!! ", "New York") < 100
    assert match_normalized("  new york!! ", CHOICES) == ("New York", 100.0, 0)


def test_token_sort_ignores_word_order():
    assert fuzz.ratio("York New", "New York") < 100
    assert fuzz.token_sort_ratio("York New", "New York") == 100
    assert match_reordered("York New", ["New York"])[0] == "New York"


def test_mapping_returns_the_key_in_the_third_slot():
    # with a dict the matched value is first and the dict key is the index slot
    choice, score, key = process.extractOne(
        "new york", {"nyc": "New York"}, processor=utils.default_process
    )
    assert choice == "New York"
    assert key == "nyc"
    assert choice != key


def test_extract_keeps_best_first():
    results = closest("New York", CHOICES, limit=2)
    assert [r[0] for r in results] == ["New York", "Newark"]
    assert results[0][1] > results[1][1]
