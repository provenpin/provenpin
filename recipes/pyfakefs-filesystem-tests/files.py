import json
from pathlib import Path


def write_text(path, text):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def read_text(path, default=None):
    try:
        return Path(path).read_text(encoding="utf-8")
    except FileNotFoundError:
        return default


def append_line(path, line):
    with open(path, "a", encoding="utf-8") as handle:
        handle.write(f"{line}\n")


def load_json(path):
    return json.loads(read_text(path))


def list_files(directory, pattern="*"):
    return sorted(p.name for p in Path(directory).glob(pattern) if p.is_file())
