from __future__ import annotations

from dataclasses import dataclass

from charset_normalizer import from_bytes, is_binary


@dataclass(frozen=True)
class Decoded:
    text: str
    encoding: str
    bom: bool
    language: str
    ambiguous: tuple[str, ...]


def decode_sample(data: bytes, *, cp_isolation: list[str] | None = None) -> Decoded:
    """Decode one byte sample, recording every charset that fits equally well."""
    match = from_bytes(data, cp_isolation=cp_isolation).best()
    if match is None:
        raise ValueError("no text encoding matched the sample")
    return Decoded(
        text=str(match),
        encoding=match.encoding,
        bom=match.bom,
        language=match.language,
        ambiguous=tuple(match.could_be_from_charset),
    )


def decode_mixed(samples: list[bytes]) -> list[Decoded]:
    """Decode a batch where each sample may use a different encoding."""
    decoded: list[Decoded] = []
    for sample in samples:
        if is_binary(sample):
            raise ValueError("binary sample cannot be decoded as text")
        decoded.append(decode_sample(sample))
    return decoded
