import json

import pytest
import zstandard as zstd

from codec import (
    compress_many,
    compress_one,
    decompress_many,
    decompress_one,
    encode,
    train_dict,
)

CONTENTSIZE_UNKNOWN = 2**64 - 1


def make_records(count: int = 200) -> list[dict]:
    return [
        {"id": i, "user": f"user{i % 5}", "action": "login", "ok": True}
        for i in range(count)
    ]


@pytest.fixture(scope="module")
def dict_data():
    return train_dict(make_records())


def test_one_shot_roundtrip_and_content_size(dict_data):
    record = make_records(1)[0]
    blob = compress_one(record, dict_data)
    assert len(blob) < len(encode(record))
    assert zstd.get_frame_parameters(blob).content_size == len(encode(record))
    assert decompress_one(blob, dict_data) == record


def test_streaming_frame_has_unknown_content_size(dict_data):
    records = make_records(50)
    blob = compress_many(records, dict_data)
    assert zstd.get_frame_parameters(blob).content_size == CONTENTSIZE_UNKNOWN
    with pytest.raises(zstd.ZstdError, match="content size"):
        zstd.ZstdDecompressor(dict_data=dict_data).decompress(blob)
    assert decompress_many(blob, dict_data) == records


def test_write_content_size_false_needs_max_output_size(dict_data):
    raw = encode(make_records(1)[0])
    blob = zstd.ZstdCompressor(level=19, dict_data=dict_data, write_content_size=False).compress(raw)
    with pytest.raises(zstd.ZstdError):
        zstd.ZstdDecompressor(dict_data=dict_data).decompress(blob)
    assert zstd.ZstdDecompressor(dict_data=dict_data).decompress(blob, max_output_size=len(raw) + 1) == raw


def test_dictionary_mismatch_raises(dict_data):
    blob = compress_one(make_records(1)[0], dict_data)
    with pytest.raises(zstd.ZstdError, match="Dictionary mismatch"):
        zstd.ZstdDecompressor().decompress(blob)


def test_compressobj_must_be_flushed_then_closed(dict_data):
    record = make_records(1)[0]
    cobj = zstd.ZstdCompressor(level=19, dict_data=dict_data).compressobj()
    buffered = cobj.compress(encode(record))
    blob = buffered + cobj.flush()
    raw = zstd.ZstdDecompressor(dict_data=dict_data).decompressobj().decompress(blob)
    assert json.loads(raw) == record
    with pytest.raises(zstd.ZstdError, match="finished"):
        cobj.compress(encode(record))


def test_training_needs_enough_samples():
    with pytest.raises(zstd.ZstdError):
        train_dict([{"a": 1}, {"b": 2}])
