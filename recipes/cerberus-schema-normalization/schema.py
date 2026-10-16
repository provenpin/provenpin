from cerberus import Validator


def default_nickname(doc):
    return doc["username"].split("@")[0].strip()


def strong_password(field, value, error):
    if not any(c.isdigit() for c in value):
        error(field, "must contain a digit")


SIGNUP = {
    "username": {
        "type": "string",
        "coerce": str.strip,
        "required": True,
        "empty": False,
        "is_lower": True,
    },
    "email": {
        "type": "string",
        "required": True,
        "regex": r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    },
    "age": {"type": "integer", "coerce": int, "min": 13},
    "password": {"type": "string", "required": True, "check_with": strong_password},
    "role": {"type": "string", "default": "viewer", "allowed": ["viewer", "editor"]},
    "tags": {
        "type": "list",
        "default": [],
        "schema": {"type": "string", "coerce": str.lower},
    },
    "nickname": {"type": "string", "default_setter": default_nickname},
}


class SignupValidator(Validator):
    def _validate_is_lower(self, is_lower, field, value):
        """{'type': 'boolean'}"""
        if is_lower and value != value.lower():
            self._error(field, "must be lowercase")
