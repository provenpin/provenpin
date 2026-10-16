from natsort import natsorted

from sorting import (
    sort_case_insensitive,
    sort_decimal_versions,
    sort_filenames,
    sort_paths,
    sort_rows,
    sort_versions,
)


def test_filenames_use_natural_order():
    names = ["file10", "file2", "file1", "file20"]
    assert sorted(names) == ["file1", "file10", "file2", "file20"]
    assert sort_filenames(names) == ["file1", "file2", "file10", "file20"]


def test_versions_are_compared_componentwise():
    versions = ["1.9.0", "1.10.0", "1.2.3", "1.10.1"]
    assert sort_versions(versions) == ["1.2.3", "1.9.0", "1.10.0", "1.10.1"]


def test_case_insensitive_needs_the_ignorecase_flag():
    values = ["Apple", "apple", "Banana", "banana"]
    assert natsorted(values) == ["Apple", "Banana", "apple", "banana"]
    assert sort_case_insensitive(values) == ["Apple", "apple", "Banana", "banana"]


def test_path_flag_keeps_directories_together():
    paths = ["a10/y", "a/10/y", "a/2/x"]
    assert natsorted(paths) == ["a10/y", "a/2/x", "a/10/y"]
    assert sort_paths(paths) == ["a/2/x", "a/10/y", "a10/y"]


def test_parallel_lists_follow_the_same_order():
    filenames = ["img12.png", "img1.png", "img2.png"]
    sizes = ["large", "small", "medium"]
    ordered_files, ordered_sizes = sort_rows(filenames, sizes)
    assert ordered_files == ["img1.png", "img2.png", "img12.png"]
    assert ordered_sizes == ["small", "medium", "large"]


def test_float_algorithm_reads_decimals_as_numbers():
    versions = ["1.5", "1.10", "1.9"]
    assert sort_versions(versions) == ["1.5", "1.9", "1.10"]
    assert sort_decimal_versions(versions) == ["1.10", "1.5", "1.9"]
