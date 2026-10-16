import pytest
import cytoolz
import cytoolz.curried
from toolz import compose, curry, pipe
from cytoolz import curry as ccurry

from pipeline import scale, bump, add_one, running_total, evens_plus_one


def test_compose_is_right_to_left():
    assert compose(add_one, scale(2))(5) == 11
    assert pipe(5, scale(2), add_one) == 11
    assert compose(scale(2), add_one)(5) == 12


def test_cytoolz_pipeline_is_lazy():
    seen = []

    def record(x):
        seen.append(x)
        return x

    stream = compose(
        cytoolz.curried.map(record),
        cytoolz.curried.filter(lambda n: n % 2 == 0),
    )([1, 2, 3, 4])

    assert seen == []
    with pytest.raises(TypeError):
        len(stream)
    assert list(stream) == [2, 4]
    assert seen == [2, 4]


def test_lazy_iterator_is_single_use():
    stream = evens_plus_one([1, 2, 3, 4])
    assert list(stream) == [3, 5]
    assert list(stream) == []


def test_top_level_cytoolz_map_is_not_curried():
    with pytest.raises(TypeError):
        cytoolz.map(add_one)
    assert list(cytoolz.curried.map(add_one)([1, 2])) == [2, 3]


def test_curry_and_default_arguments():
    @ccurry
    def tag(prefix, value, sep="-"):
        return f"{prefix}{sep}{value}"

    assert callable(tag("x"))
    assert tag("x", "y") == "x-y"
    assert tag("x", sep=":")("y") == "x:y"


def test_toolz_and_cytoolz_curry_compose_together():
    def inc_by(value, by):
        return value + by

    t_inc = curry(inc_by)
    c_inc = ccurry(inc_by)

    assert type(t_inc) is not type(c_inc)
    pipeline = compose(scale(2), c_inc(1), t_inc(10))
    assert list(map(pipeline, [1, 2])) == [24, 26]
    assert running_total([1, 2, 3, 4]) == 20
