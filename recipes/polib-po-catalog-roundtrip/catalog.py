import polib

PLURAL_FORMS = "nplurals=2; plural=(n > 1);"


def new_catalog(locale="fr"):
    po = polib.POFile()
    po.metadata = {
        "Project-Id-Version": "demo",
        "Language": locale,
        "Content-Type": "text/plain; charset=UTF-8",
        "Plural-Forms": PLURAL_FORMS,
    }
    return po


def add(po, msgid, msgstr="", fuzzy=False, plural=None):
    # fuzzy=True is silently dropped by POEntry; the flag list is the real switch
    entry = polib.POEntry(
        msgid=msgid,
        msgstr=msgstr,
        msgid_plural=plural,
        msgstr_plural={},
        flags=["fuzzy"] if fuzzy else [],
    )
    po.append(entry)
    return entry


def translate(po, msgid, msgstr):
    entry = po.find(msgid)
    if entry is None:
        entry = add(po, msgid)
    entry.msgstr = msgstr
    if "fuzzy" in entry.flags:
        entry.flags.remove("fuzzy")
    return entry


def load(path):
    return polib.pofile(str(path))


def save(po, path):
    po.save(str(path))


def compile_to_mo(po, path):
    po.save_as_mofile(str(path))


def missing_forms(entry, nplurals=2):
    return [i for i in range(nplurals) if entry.msgstr_plural.get(i, "") == ""]


def audit(po):
    return {
        "total": len(po),
        "translated": len(po.translated_entries()),
        "fuzzy": len(po.fuzzy_entries()),
        "untranslated": len(po.untranslated_entries()),
        "percent": po.percent_translated(),
    }
