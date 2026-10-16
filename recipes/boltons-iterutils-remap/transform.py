from boltons.iterutils import get_path, remap

SECRET_KEYS = {"password", "token", "secret", "api_key"}
_UNSET = object()


def redact_secrets(obj, keys=SECRET_KEYS, mask="***"):
    def visit(path, key, value):
        if isinstance(key, str) and key.lower() in keys:
            return key, mask
        return True

    return remap(obj, visit)


def drop_nones(obj):
    def visit(path, key, value):
        if value is None:
            return False
        return True

    return remap(obj, visit)


def rename_keys(obj, mapping):
    def visit(path, key, value):
        if key in mapping:
            return mapping[key], value
        return True

    return remap(obj, visit)


def nested_get(obj, path, default=_UNSET):
    if default is _UNSET:
        return get_path(obj, path)
    return get_path(obj, path, default=default)
