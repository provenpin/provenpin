from __future__ import annotations

from dataclasses import dataclass

import chardet

CONFIDENCE_FLOOR = 0.5


@dataclass(frozen=True)
class Detection:
    encoding: str | None
    confidence: float
    language: str | None
    text: str


def detect_bytes(data: bytes, *, include: list[str] | None = None) -> Detection:
    """Detect the charset of one sample and decode it with that guess."""
    result = chardet.detect(data, include_encodings=include)
    encoding = result["encoding"]
    text = "" if encoding is None else data.decode(encoding, errors="replace")
    return Detection(encoding, result["confidence"], result["language"], text)


def decode_or_fallback(data: bytes, fallback: str = "cp1252", floor: float = CONFIDENCE_FLOOR) -> str:
    """Trust chardet only above the floor, otherwise decode with a known fallback."""
    detection = detect_bytes(data)
    if detection.encoding is None or detection.confidence < floor:
        return data.decode(fallback, errors="replace")
    return detection.text
