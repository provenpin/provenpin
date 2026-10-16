import pytest
from charset_normalizer import detect
from decode import decode_mixed, decode_sample


def test_mixed_batch_decodes_each_sample():
    decoded = decode_mixed(
        [
            "Héllo wörld, naïve café".encode("utf-8"),
            "Café “smart” dash".encode("cp1252"),
            "Hello".encode("utf-16"),
        ]
    )
    assert [d.text for d in decoded] == [
        "Héllo wörld, naïve café",
        "Café “smart” dash",
        "Hello",
    ]


def test_ambiguity_is_reported_for_cp1252():
    decoded = decode_sample("Café “smart” dash".encode("cp1252"))
    assert decoded.text == "Café “smart” dash"
    assert "cp1252" in decoded.ambiguous
    assert len(decoded.ambiguous) > 1


def test_bom_is_stripped_and_flagged():
    utf8 = decode_sample("Hi".encode("utf-8-sig"))
    assert utf8.encoding == "utf_8" and utf8.bom
    assert utf8.text == "Hi"

    utf16 = decode_sample("Hi".encode("utf-16"))
    assert utf16.encoding == "utf_16" and utf16.bom
    assert utf16.text == "Hi"


def test_legacy_detect_penalizes_short_non_utf8():
    small = detect("Café “smart” dash".encode("cp1252"))
    assert small["encoding"] == "windows-1250"
    assert small["confidence"] == 0.8

    full = detect("Héllo wörld, naïve café".encode("utf-8"))
    assert full["encoding"] == "utf-8"
    assert full["confidence"] == 1.0


def test_cp_isolation_pins_ambiguous_latin1():
    data = "Café résumé naïve".encode("latin-1")
    assert decode_sample(data).text.endswith("naďve")

    pinned = decode_sample(data, cp_isolation=["latin_1"])
    assert pinned.encoding == "latin_1"
    assert pinned.text.endswith("naïve")


def test_binary_rejected_but_empty_is_valid():
    with pytest.raises(ValueError):
        decode_mixed([bytes(range(256))])

    empty = decode_sample(b"")
    assert empty.text == ""
    assert empty.encoding == "utf_8"
