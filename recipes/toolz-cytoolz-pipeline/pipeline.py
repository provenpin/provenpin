from toolz import compose, curry, pipe
from cytoolz import curry as ccurry
from cytoolz.curried import map as cmap, filter as cfilter, reduce as creduce


@ccurry
def scale(factor, value):
    return factor * value


@ccurry
def bump(value, by):
    return value + by


def add_one(value):
    return value + 1


def running_total(values):
    # cmap is lazy, creduce consumes it left to right
    return creduce(bump, cmap(scale(2), values), 0)


def evens_plus_one(values):
    # returns a lazy cytoolz iterator, nothing runs until consumed
    return cmap(add_one, cfilter(lambda x: x % 2 == 0, values))
