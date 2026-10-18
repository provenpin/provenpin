import os
import stat
from pathlib import Path

import pytest
from pyfakefs.helpers import get_uid

from files import append_line, list_files, load_json, read_text, write_text


def test_reads_prepopulated_file(fs):
    fs.create_file("/etc/app/config.json", contents='{"retries": 3, "url": "http://x"}')
    assert load_json("/etc/app/config.json") == {"retries": 3, "url": "http://x"}


def test_missing_file_returns_default(fs):
    assert read_text("/nope/missing.txt", default="fallback") == "fallback"


def test_write_creates_missing_parents(fs):
    with pytest.raises(FileNotFoundError):
        Path("/deep/a/b/c.txt").write_text("x")
    write_text("/deep/a/b/c.txt", "hello")
    assert read_text("/deep/a/b/c.txt") == "hello"


def test_lists_only_regular_files(fs):
    fs.create_dir("/data/nested")
    for name in ("b.txt", "a.txt", "c.txt"):
        fs.create_file(f"/data/{name}", contents=name)
    assert list_files("/data") == ["a.txt", "b.txt", "c.txt"]


def test_read_only_file_blocks_writes(fs):
    from pyfakefs.fake_filesystem import set_uid

    previous = get_uid()
    set_uid(1000)
    try:
        fs.create_file(
            "/data/ro.txt",
            contents="secret\n",
            st_mode=stat.S_IFREG | 0o400,
            apply_umask=False,
        )
        assert stat.S_IMODE(os.stat("/data/ro.txt").st_mode) == 0o400
        assert read_text("/data/ro.txt") == "secret\n"
        with pytest.raises(PermissionError):
            append_line("/data/ro.txt", "nope")
        os.chmod("/data/ro.txt", 0o600)
        append_line("/data/ro.txt", "ok")
        assert read_text("/data/ro.txt") == "secret\nok\n"
    finally:
        set_uid(previous)


def test_simulates_write_error(fs):
    def disk_full(_handle):
        raise OSError("disk full")

    fs.create_file("/var/log/app.log", side_effect=disk_full)
    with pytest.raises(OSError, match="disk full"):
        append_line("/var/log/app.log", "hello")
