from natsort import (
    index_natsorted,
    natsort_keygen,
    natsorted,
    ns,
    order_by_index,
)


def sort_filenames(names):
    return natsorted(names)


def sort_versions(versions):
    return natsorted(versions)


def sort_case_insensitive(values):
    return natsorted(values, alg=ns.IGNORECASE)


def sort_paths(paths):
    return natsorted(paths, alg=ns.PATH)


def sort_rows(filenames, sizes):
    order = index_natsorted(filenames)
    return [filenames[i] for i in order], order_by_index(sizes, order)


def sort_decimal_versions(versions):
    key = natsort_keygen(alg=ns.FLOAT)
    return sorted(versions, key=key)
