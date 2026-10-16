from voluptuous import (
    Schema, Required, Optional, All, Coerce, Range, In, Length,
    MultipleInvalid, REMOVE_EXTRA,
)

def to_bool(value):
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in ("1", "true", "yes", "on"):
        return True
    if text in ("0", "false", "no", "off"):
        return False
    raise ValueError(f"cannot coerce {value!r} to bool")

NonEmptyStr = All(Coerce(str), Length(min=1))
Port = All(Coerce(int), Range(min=1, max=65535))
LogLevel = All(Coerce(str), In(["debug", "info", "warning", "error"]))

CONFIG_SCHEMA = Schema(
    {
        Required("host"): NonEmptyStr,
        Required("workers"): All(Coerce(int), Range(min=1, max=64)),
        Optional("port", default="8080"): Port,
        Optional("debug", default=False): Coerce(to_bool),
        Optional("log_level", default="info"): LogLevel,
    },
    extra=REMOVE_EXTRA,
)

def load_config(data):
    return CONFIG_SCHEMA(data)
