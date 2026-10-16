import pytest
from more_itertools import peekable

from stream_ops import flatten_tags, peek_header, rolling, to_batches


def test_batched_returns_tuples_and_short_tail():
    assert to_batches(range(5), 2) == [(0, 1), (2, 3), (4,)]


def test_batched_strict_rejects_incomplete_batch():
    with pytest.raises(ValueError, match="incomplete batch"):
        to_batches(range(5), 2, strict=True)


def test_windowed_pads_short_sequences_with_fillvalue():
    assert rolling([1, 2, 3], 4) == [(1, 2, 3, None)]
    assert rolling([1, 2, 3], 4, fillvalue=0) == [(1, 2, 3, 0)]
    with pytest.raises(ValueError):
        rolling([1, 2, 3], 0)


def test_windowed_step_pads_the_tail_window():
    assert rolling([1, 2, 3, 4, 5, 6], 3, step=2) == [
        (1, 2, 3),
        (3, 4, 5),
        (5, 6, None),
    ]
    assert rolling([1, 2, 3, 4, 5, 6], 3, step=2, fillvalue=0) == [
        (1, 2, 3),
        (3, 4, 5),
        (5, 6, 0),
    ]


def test_collapse_never_splits_strings():
    assert flatten_tags(["ab", ["cd"]]) == ["ab", "cd"]
    assert flatten_tags(["ab", ("cd", "ef")], base_type=tuple) == ["ab", ("cd", "ef")]
    assert flatten_tags([[[1]], [[2]]], levels=1) == [[1], [2]]


def test_peekable_peeks_without_consuming_stream():
    stream = peekable([1, 2, 3])
    assert stream.peek() == 1 and stream.peek() == 1
    assert next(stream) == 1
    assert peekable([]).peek(default="empty") == "empty"
    with pytest.raises(StopIteration):
        peekable([]).peek()
    assert peek_header(["#sensor", "20", "21"]) == ("#sensor", ["20", "21"])
    assert peek_header(["20", "21"]) == ("20", ["20", "21"])
