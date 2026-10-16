import pytest
from beartype.roar import BeartypeCallHintParamViolation
from pydantic import ValidationError

from checks import (
    Account,
    SchemaError,
    credit,
    nominal,
    parse_account,
    positive_int,
    rate_of,
    rate_of_lax,
    snapshot,
)


def test_pydantic_coerces_but_beartype_does_not():
    account = parse_account({"name": "ada", "balance": "5"})
    assert account.balance == 5
    with pytest.raises(BeartypeCallHintParamViolation):
        snapshot({"name": "ada", "balance": 5})


def test_pep484_tower_matches_pydantic_int_to_float():
    account = parse_account({"name": "ada", "balance": 1, "rate": 2})
    assert account.rate == 2.0
    with pytest.raises(BeartypeCallHintParamViolation):
        rate_of(2)
    assert rate_of_lax(2) == 2


def test_beartype_drops_pydantic_constraint_metadata():
    assert nominal(-5) == -5
    with pytest.raises(ValidationError):
        positive_int.validate_python(-5)


def test_app_conf_routes_violations_to_schema_error():
    account = parse_account({"name": "ada", "balance": 1})
    with pytest.raises(SchemaError):
        credit(account, "10")


def test_model_construct_bypasses_both_until_revalidated():
    sneaky = Account.model_construct(name="ada", balance=-1)
    assert snapshot(sneaky) == "ada:-1"
    with pytest.raises(ValidationError):
        parse_account(sneaky)
