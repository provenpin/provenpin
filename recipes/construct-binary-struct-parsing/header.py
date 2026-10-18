import zlib

from construct import (
    Bytes,
    Checksum,
    Const,
    Enum,
    GreedyRange,
    Int8ul,
    Int16ul,
    Int32ul,
    Rebuild,
    Struct,
    len_,
    this,
)

MAGIC = b"PPAK"
Kind = Enum(Int8ul, FILE=1, DIR=2, LINK=3)


def crc32(data: bytes) -> int:
    return zlib.crc32(data) & 0xFFFFFFFF


Header = Struct(
    "magic" / Const(MAGIC),
    "version" / Int16ul,
    "kind" / Kind,
    "name_len" / Rebuild(Int8ul, len_(this.name)),
    "name" / Bytes(this.name_len),
    "data_len" / Rebuild(Int16ul, len_(this.data)),
    "data" / Bytes(this.data_len),
    "crc" / Checksum(Int32ul, crc32, this.data),
)

Archive = GreedyRange(Header)


def build_header(name: str, data: bytes, kind: str = "FILE", version: int = 1) -> bytes:
    # name_len and data_len are Rebuild fields, so callers never pass them
    return Header.build(dict(version=version, kind=kind, name=name.encode(), data=data))


def parse_header(raw: bytes):
    return Header.parse(raw)
