from datetime import datetime, timezone

import pytest
from pydantic import TypeAdapter, ValidationError

from models import LazySettings, Money, Ordered, Product, StrictSettings


def product(**over):
    data = {"name": "widget", "price": 1, "updated_at": datetime(2024, 1, 1, 12, 0)}
    data.update(over)
    return Product(**data)


def test_before_then_after_validators():
    assert product(price="$1,200.50").price == 1200.5


def test_after_error_is_reported_on_the_field():
    with pytest.raises(ValidationError) as exc:
        product(price=-5)
    err = exc.value.errors()[0]
    assert err["loc"] == ("price",) and "non-negative" in err["msg"]


def test_after_validator_normalizes_naive_datetime():
    assert product().updated_at == datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    aware = product(updated_at=datetime(2024, 1, 1, 17, 0, tzinfo=timezone.utc))
    assert aware.updated_at.tzinfo is timezone.utc


def test_annotated_type_is_reusable_standalone():
    ta = TypeAdapter(Money)
    assert ta.validate_python("$10") == 10.0
    with pytest.raises(ValidationError):
        ta.validate_python("-3")


def test_after_validators_run_left_to_right():
    assert TypeAdapter(Ordered).validate_python(["x"]) == ["x", "a", "b"]


def test_defaults_are_not_validated_unless_configured():
    assert LazySettings().retries == 3
    assert StrictSettings().retries == 4
