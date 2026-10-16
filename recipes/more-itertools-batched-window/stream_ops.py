from more_itertools import batched, collapse, peekable, windowed


def to_batches(records, size, strict=False):
    return list(batched(records, size, strict=strict))


def rolling(values, size, step=1, fillvalue=None):
    return list(windowed(values, size, fillvalue=fillvalue, step=step))


def flatten_tags(nested, base_type=None, levels=None):
    return list(collapse(nested, base_type=base_type, levels=levels))


def peek_header(lines):
    stream = peekable(lines)
    header = stream.peek(None)
    if header is not None and header.startswith("#"):
        next(stream)
    return header, list(stream)
