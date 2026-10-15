from hypothesis import given, strategies as st
from pydantic import ValidationError
from models import Category, Item

def items():
    # st.builds calls Item(...), so every generated value must pass the validators.
    # Generate sku with surrounding spaces to exercise normalization.
    # allow_nan=False and allow_infinity=False: NaN/inf are not valid JSON numbers.
    return st.builds(
        Item,
        sku=st.from_regex(r" ?[a-z0-9]{1,10} ?", fullmatch=True),
        qty=st.integers(min_value=0, max_value=10**6),
        price=st.floats(min_value=0, allow_nan=False, allow_infinity=False),
        category=st.from_type(Category),
        tags=st.lists(st.text(max_size=8), max_size=3).map(tuple),
    )

@given(items())
def test_json_roundtrip(item):
    assert Item.model_validate_json(item.model_dump_json()) == item

@given(items())
def test_python_dump_roundtrip(item):
    assert Item.model_validate(item.model_dump()) == item

@given(st.text(max_size=20))
def test_sku_validator_is_idempotent(raw):
    # Arbitrary text is either rejected or normalized. Accepted values must be stable.
    try:
        item = Item(sku=raw, qty=0, price=0.0, category=Category.TOOL)
    except ValidationError:
        return
    assert Item(**item.model_dump()).sku == item.sku
