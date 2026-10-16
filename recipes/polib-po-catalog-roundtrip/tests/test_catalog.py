import polib

from catalog import add, audit, compile_to_mo, load, missing_forms, new_catalog, save, translate


def test_edit_roundtrip_upserts_and_persists(tmp_path):
    po = new_catalog("fr")
    add(po, "Hello", "Bonjour")
    add(po, "Bye", "")
    path = tmp_path / "fr.po"
    save(po, path)

    reloaded = load(path)
    translate(reloaded, "Bye", "Au revoir")
    translate(reloaded, "New", "Nouveau")
    save(reloaded, path)

    again = load(path)
    assert again.find("Hello").msgstr == "Bonjour"
    assert again.find("Bye").msgstr == "Au revoir"
    assert again.find("New").msgstr == "Nouveau"
    assert audit(again)["untranslated"] == 0


def test_fuzzy_kwarg_is_ignored_only_flags_work():
    ignored = polib.POEntry(msgid="x", msgstr="y", fuzzy=True)
    assert ignored.fuzzy is False
    assert ignored.translated() is True

    marked = polib.POEntry(msgid="x", msgstr="y", flags=["fuzzy"])
    assert marked.fuzzy is True
    assert marked.translated() is False


def test_fuzzy_is_neither_translated_nor_untranslated(tmp_path):
    po = new_catalog("fr")
    add(po, "Draft", "Brouillon", fuzzy=True)
    add(po, "Done", "Fait")
    add(po, "Todo", "")
    path = tmp_path / "fr.po"
    save(po, path)

    reloaded = load(path)
    assert [e.msgid for e in reloaded.translated_entries()] == ["Done"]
    assert [e.msgid for e in reloaded.fuzzy_entries()] == ["Draft"]
    assert [e.msgid for e in reloaded.untranslated_entries()] == ["Todo"]
    assert audit(reloaded)["percent"] == 33


def test_translate_clears_fuzzy_flag():
    po = new_catalog("fr")
    add(po, "Greeting", "Salut", fuzzy=True)
    translate(po, "Greeting", "Bonjour")
    entry = po.find("Greeting")
    assert entry.fuzzy is False
    assert entry.translated() is True


def test_partial_plural_missing_form_is_not_flagged(tmp_path):
    po = new_catalog("fr")
    po.append(polib.POEntry(msgid="File", msgid_plural="Files", msgstr_plural={0: "Fichier"}))
    po.append(polib.POEntry(msgid="Cat", msgid_plural="Cats", msgstr_plural={0: "Chat", 1: ""}))
    path = tmp_path / "fr.po"
    save(po, path)

    reloaded = load(path)
    assert reloaded.find("File").translated() is True
    assert missing_forms(reloaded.find("File"), nplurals=2) == [1]
    assert reloaded.find("Cat").translated() is False
    assert missing_forms(reloaded.find("Cat"), nplurals=2) == [1]


def test_mo_compile_drops_fuzzy_and_untranslated(tmp_path):
    po = new_catalog("fr")
    add(po, "Hello", "Bonjour")
    add(po, "Draft", "Brouillon", fuzzy=True)
    add(po, "Todo", "")
    add(po, "File", plural="Files")
    po.find("File").msgstr_plural = {0: "Fichier", 1: "Fichiers"}

    mo_path = tmp_path / "fr.mo"
    compile_to_mo(po, mo_path)

    mo = polib.mofile(str(mo_path))
    assert mo.find("Hello").msgstr == "Bonjour"
    assert mo.find("File").msgstr_plural == {0: "Fichier", 1: "Fichiers"}
    assert mo.find("Draft") is None
    assert mo.find("Todo") is None
    assert mo.metadata["Content-Type"] == "text/plain; charset=UTF-8"
