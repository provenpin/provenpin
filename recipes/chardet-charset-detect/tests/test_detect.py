from detect import CONFIDENCE_FLOOR, decode_or_fallback, detect_bytes


def test_utf8_plain_is_confident():
    det = detect_bytes("Héllo wörld, naïve café".encode("utf-8"))
    assert det.encoding == "utf-8"
    assert det.confidence >= 0.95
    assert det.text == "Héllo wörld, naïve café"


def test_latin1_is_misdetected_so_fallback_wins():
    raw = "Café résumé naïve".encode("latin-1")
    det = detect_bytes(raw)
    assert det.encoding != "ISO-8859-1"
    assert det.confidence < 0.2
    assert det.text != "Café résumé naïve"
    assert decode_or_fallback(raw, floor=CONFIDENCE_FLOOR) == "Café résumé naïve"


def test_include_encodings_pins_the_candidate_set():
    raw = "Café résumé naïve".encode("latin-1")
    det = detect_bytes(raw, include=["iso-8859-1", "windows-1252"])
    assert det.encoding == "Windows-1252"
    assert det.text == "Café résumé naïve"
    assert det.confidence < 0.2


def test_shift_jis_is_reported_as_cp932_superset():
    raw = "こんにちは世界、日本語のテスト".encode("shift-jis")
    det = detect_bytes(raw)
    assert det.encoding == "CP932"
    assert det.language == "ja"
    assert det.confidence < 0.7
    assert det.text == "こんにちは世界、日本語のテスト"


def test_utf8_bom_short_circuits():
    det = detect_bytes("Hi".encode("utf-8-sig"))
    assert det.encoding == "UTF-8-SIG"
    assert det.confidence == 1.0
    assert det.text == "Hi"


def test_binary_and_empty_are_edge_cases():
    binary = detect_bytes(bytes(range(256)))
    assert binary.encoding is None
    assert binary.text == ""
    assert binary.confidence == 0.95

    empty = detect_bytes(b"")
    assert empty.encoding == "utf-8"
    assert empty.confidence == 0.1
