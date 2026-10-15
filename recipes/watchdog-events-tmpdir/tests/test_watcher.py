from pathlib import Path

from watcher import DirectoryWatcher


def is_file_event(event_type, path):
    return lambda e: (
        e.event_type == event_type
        and not e.is_directory
        and Path(e.src_path) == path
    )


def test_created_file(tmp_path):
    target = tmp_path / "hello.txt"
    with DirectoryWatcher(tmp_path) as events:
        target.write_text("hi")
        event = events.wait_for(is_file_event("created", target))
    assert Path(event.src_path) == target


def test_modified_file(tmp_path):
    target = tmp_path / "data.txt"
    target.write_text("one")
    with DirectoryWatcher(tmp_path) as events:
        target.write_text("two")
        event = events.wait_for(is_file_event("modified", target))
    assert Path(event.src_path) == target


def test_moved_file_reports_dest(tmp_path):
    src = tmp_path / "a.txt"
    src.write_text("x")
    dst = tmp_path / "b.txt"
    with DirectoryWatcher(tmp_path) as events:
        src.rename(dst)
        event = events.wait_for(
            lambda e: e.event_type == "moved" and Path(e.src_path) == src
        )
    assert Path(event.dest_path) == dst


def test_deleted_file(tmp_path):
    target = tmp_path / "gone.txt"
    target.write_text("x")
    with DirectoryWatcher(tmp_path) as events:
        target.unlink()
        event = events.wait_for(is_file_event("deleted", target))
    assert Path(event.src_path) == target


def test_directory_events_are_flagged(tmp_path):
    sub = tmp_path / "folder"
    with DirectoryWatcher(tmp_path) as events:
        sub.mkdir()
        event = events.wait_for(
            lambda e: e.is_directory
            and e.event_type == "created"
            and Path(e.src_path) == sub
        )
    assert event.is_directory


def test_recursive_watches_existing_subdir(tmp_path):
    sub = tmp_path / "nested"
    sub.mkdir()
    with DirectoryWatcher(tmp_path, recursive=True) as events:
        target = sub / "leaf.txt"
        target.write_text("x")
        event = events.wait_for(is_file_event("created", target))
    assert Path(event.src_path) == target
