from dictdiffer import diff, patch, revert


def make_patch(first, second, ignore=None):
    """Materialize the diff between two nested dicts.

    dictdiffer.diff returns a generator, so list() is required to reuse the
    same patch with both patch() and revert(): an exhausted generator makes
    revert() silently do nothing.
    """
    return list(diff(first, second, ignore=ignore))


def apply_patch(operations, base):
    """Apply a patch to base, returning a new dict (base is untouched)."""
    return patch(operations, base)


def undo_patch(operations, changed):
    """Revert a patch, returning a new dict (changed is untouched)."""
    return revert(operations, changed)


def paths_of(obj, key):
    """Every dot-notated path where key occurs anywhere in a nested dict.

    diff()'s ignore argument matches paths, not key names, so a key that
    recurs at several depths needs each dotted path collected explicitly.
    """
    found = set()

    def walk(node, prefix):
        if isinstance(node, dict):
            for name, value in node.items():
                path = f"{prefix}.{name}" if prefix else name
                if name == key:
                    found.add(path)
                walk(value, path)

    walk(obj, "")
    return found
