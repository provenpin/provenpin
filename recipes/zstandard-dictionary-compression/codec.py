import json
import zstandard as zstd

LEVEL = 19


def encode(record: dict) -> bytes:
    return json.dumps(record, separators=(",", ":")).encode()


def train_dict(records: list[dict], size: int = 4096, level: int = LEVEL) -> zstd.ZstdCompressionDict:
    dict_data = zstd.train_dictionary(size, [encode(r) for r in records])
    dict_data.precompute_compress(level=level)
    return dict_data


def compress_one(record: dict, dict_data: zstd.ZstdCompressionDict, level: int = LEVEL) -> bytes:
    return zstd.ZstdCompressor(level=level, dict_data=dict_data).compress(encode(record))


def decompress_one(blob: bytes, dict_data: zstd.ZstdCompressionDict) -> dict:
    return json.loads(zstd.ZstdDecompressor(dict_data=dict_data).decompress(blob))


def compress_many(records: list[dict], dict_data: zstd.ZstdCompressionDict, level: int = 3) -> bytes:
    cobj = zstd.ZstdCompressor(level=level, dict_data=dict_data).compressobj()
    chunks = [cobj.compress(encode(record) + b"\n") for record in records]
    chunks.append(cobj.flush())
    return b"".join(chunks)


def decompress_many(blob: bytes, dict_data: zstd.ZstdCompressionDict) -> list[dict]:
    raw = zstd.ZstdDecompressor(dict_data=dict_data).decompressobj().decompress(blob)
    return [json.loads(line) for line in raw.splitlines()]
