import zlib

import pytest
from construct import ChecksumError, ConstError, ConstructError, StreamError

from header import Archive, build_header, parse_header


def test_roundtrip_rebuilds_lengths():
    raw = build_header("readme.txt", b"hello", version=3)
    h = parse_header(raw)
    assert h.name == b"readme.txt"
    assert h.data == b"hello"
    assert (h.name_len, h.data_len) == (10, 5)
    assert h.version == 3


def test_enum_is_an_int_subclass():
    h = parse_header(build_header("a", b"", kind="DIR"))
    assert h.kind == "DIR"
    assert int(h.kind) == 2


def test_checksum_covers_only_payload():
    h = parse_header(build_header("a.bin", b"payload"))
    assert h.crc == zlib.crc32(b"payload") & 0xFFFFFFFF


def test_corrupt_payload_is_rejected():
    raw = bytearray(build_header("a.bin", b"payload"))
    raw[-5] ^= 0x01  # flip a bit inside data, checksum stays behind it
    with pytest.raises(ChecksumError):
        parse_header(bytes(raw))


def test_bad_magic_and_truncation_fail_loudly():
    assert parse_header(build_header("a", b"")).magic == b"PPAK"
    with pytest.raises(ConstError):
        parse_header(b"XXXX" + build_header("a", b"")[4:])
    with pytest.raises((StreamError, ConstructError)):
        parse_header(build_header("a", b"12345")[:-2])


def test_concatenated_records_need_greedyrange():
    blob = build_header("a", b"1") + build_header("b", b"22", kind="LINK")
    records = Archive.parse(blob)
    assert [(r.name, r.data, r.kind) for r in records] == [
        (b"a", b"1", "FILE"),
        (b"b", b"22", "LINK"),
    ]
