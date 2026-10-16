import jellyfish
import pytest

from matcher import best_match, is_match, metaphone_key, normalize, similarity, soundex_key


def test_jaro_winkler_needs_normalized_input():
    # jellyfish does no cleaning: a raw case mismatch scores zero, accents drag it down
    assert jellyfish.jaro_winkler_similarity("smith", "SMITH") == 0.0
    assert normalize("  Jose\u0301  ") == "JOSE"
    assert similarity("smith", "SMITH") == 1.0
    assert similarity("José", "Jose") == 1.0


def test_prefix_boost_on_transposition():
    # Jaro-Winkler adds a bonus for the shared MAR- prefix
    assert round(similarity("MARTHA", "MARHTA"), 3) == 0.961


def test_soundex_collides_but_matcher_rejects():
    # both names share soundex R163, a classic false positive
    assert soundex_key("Robert") == soundex_key("Rupert") == "R163"
    assert not is_match("Robert", "Rupert")


def test_metaphone_bridges_spelling_variants():
    assert metaphone_key("Catherine") == metaphone_key("Katherine") == "K0RN"
    assert is_match("Catherine", "Katherine")


def test_empty_phonetic_keys_are_guarded():
    # digits and non-Latin names reduce to an empty key, so guard against it
    assert metaphone_key("123") == ""
    assert not is_match("", "")
    assert not is_match("\u674e", "")


def test_best_match_picks_closest_candidate():
    result = best_match("Jon", ["Jane", "John", "Jason"])
    assert result["choice"] == "John"
    assert result["score"] == pytest.approx(0.933, abs=1e-3)
