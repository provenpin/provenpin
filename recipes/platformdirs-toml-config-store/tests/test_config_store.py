import sys

import pytest

from config_store import ConfigStore


def test_missing_file_loads_an_empty_document(tmp_path):
    store = ConfigStore(path=tmp_path / "config.toml")
    doc = store.load()
    assert dict(doc) == {}
    assert store.get("ui.theme", "system") == "system"


def test_set_then_get_round_trips_through_disk(tmp_path):
    store = ConfigStore(path=tmp_path / "config.toml")
    store.set("server.host", "localhost")
    store.set("server.port", 8080)

    reloaded = ConfigStore(path=tmp_path / "config.toml")
    assert reloaded.get("server.host") == "localhost"
    assert reloaded.get("server.port") == 8080


def test_set_preserves_comments_and_key_order(tmp_path):
    path = tmp_path / "config.toml"
    path.write_text(
        "# hand edited, keep this comment\n[ui]\ntheme = 'light' # was dark\n",
        encoding="utf-8",
    )
    store = ConfigStore(path=path)
    store.set("ui.font_size", 13)

    out = path.read_text(encoding="utf-8")
    assert "# hand edited, keep this comment" in out
    assert "theme = 'light' # was dark" in out
    assert out.index("theme") < out.index("font_size")


def test_save_creates_missing_parent_directories(tmp_path):
    path = tmp_path / "does" / "not" / "exist" / "config.toml"
    assert not path.parent.exists()

    ConfigStore(path=path).set("first_run", True)
    assert path.read_text(encoding="utf-8").strip() == "first_run = true"


def test_non_string_values_round_trip(tmp_path):
    store = ConfigStore(path=tmp_path / "config.toml")
    store.set("limits.retries", 3)
    store.set("limits.ratio", 0.5)
    store.set("limits.enabled", True)
    store.set("limits.hosts", ["alpha", "beta"])

    fresh = ConfigStore(path=tmp_path / "config.toml")
    assert fresh.get("limits.retries") == 3
    assert fresh.get("limits.ratio") == 0.5
    assert fresh.get("limits.enabled") is True
    assert fresh.get("limits.hosts") == ["alpha", "beta"]


@pytest.mark.skipif(sys.platform != "linux", reason="XDG is a Linux convention")
def test_xdg_config_home_controls_the_default_location(monkeypatch, tmp_path):
    monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path))
    store = ConfigStore("provenpin")
    assert store.path == tmp_path / "provenpin" / "config.toml"
