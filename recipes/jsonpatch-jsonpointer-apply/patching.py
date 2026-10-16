"""Create, apply and invert RFC 6902 patches over RFC 6901 pointers."""
import copy

import jsonpatch
import jsonpointer


def make_patch(before, after):
    """Create the patch that turns before into after."""
    return jsonpatch.make_patch(before, after)


def apply(document, patch, in_place=False):
    """Apply a patch; jsonpatch returns a copy unless in_place is set."""
    return jsonpatch.JsonPatch(patch).apply(document, in_place=in_place)


def invert(document, patch):
    """Build the inverse patch; RFC 6902 does not define one.

    Replay the patch over a scratch copy to capture the values it
    overwrites, then emit inverse operations in reverse order.
    """
    scratch = copy.deepcopy(document)
    inverse = []
    for op in patch:
        kind, path = op["op"], op["path"]
        if kind == "add":
            inverse.append({"op": "remove", "path": path})
        elif kind in ("remove", "replace"):
            previous = jsonpointer.resolve_pointer(scratch, path)
            inverse.append(
                {
                    "op": "add" if kind == "remove" else "replace",
                    "path": path,
                    "value": previous,
                }
            )
        else:
            raise jsonpatch.JsonPatchException(f"cannot invert {kind!r}")
        scratch = jsonpatch.apply_patch(scratch, [op])
    inverse.reverse()
    return inverse


def read(document, pointer):
    """Resolve an RFC 6901 pointer, decoding ~1 (slash) and ~0 (tilde)."""
    return jsonpointer.resolve_pointer(document, pointer)


def write(document, pointer, value, in_place=True):
    """Set a pointer target; '-' appends. jsonpointer 3.x defaults to in place."""
    return jsonpointer.set_pointer(document, pointer, value, inplace=in_place)
