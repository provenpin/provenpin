from schema import SIGNUP, SignupValidator

BASE = {
    "username": "ada",
    "email": "ada@example.com",
    "age": "36",
    "password": "s3cret",
}


def test_validated_coerces_and_applies_defaults():
    v = SignupValidator(SIGNUP)
    doc = v.validated({**BASE, "tags": ["Math", "LOGIC"]})
    assert v.errors == {}
    assert doc["age"] == 36
    assert doc["role"] == "viewer"
    assert doc["tags"] == ["math", "logic"]
    assert doc["nickname"] == "ada"


def test_normalized_skips_validation_rules():
    v = SignupValidator(SIGNUP)
    out = v.normalized({**BASE, "username": "Ada"})
    assert out["username"] == "Ada" and v.errors == {}
    assert v.validated({**BASE, "username": "Ada"}) is None
    assert v.errors["username"] == ["must be lowercase"]


def test_default_overrides_none_unless_nullable():
    plain = SignupValidator({"role": {"type": "string", "default": "viewer"}})
    assert plain.normalized({})["role"] == "viewer"
    assert plain.normalized({"role": None})["role"] == "viewer"
    nullable = SignupValidator(
        {"role": {"type": "string", "default": "viewer", "nullable": True}}
    )
    assert nullable.normalized({"role": None})["role"] is None


def test_purge_unknown_vs_unknown_rejected():
    loose = SignupValidator(SIGNUP, purge_unknown=True)
    assert "admin" not in loose.normalized({**BASE, "admin": True})
    strict = SignupValidator(SIGNUP)
    assert strict.validate({**BASE, "age": 36, "admin": True}) is False
    assert strict.errors["admin"] == ["unknown field"]


def test_check_with_password_rule():
    v = SignupValidator(SIGNUP)
    assert v.validate({**BASE, "age": 36, "password": "nodigits"}) is False
    assert v.errors["password"] == ["must contain a digit"]
