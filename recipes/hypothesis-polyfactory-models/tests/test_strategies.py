import hypothesis.strategies as st
import pytest
from hypothesis import given
from hypothesis.errors import HypothesisWarning, ResolutionFailed
from pydantic import HttpUrl, ValidationError

from factories import CouponFactory, MerchantFactory
from models import Coupon
from strategies import field, from_factory


def test_hypothesis_cannot_resolve_pydantic_url():
    with pytest.raises(ResolutionFailed):
        st.from_type(HttpUrl).validate()


def test_hypothesis_ignores_regex_pattern():
    strategy = st.builds(Coupon)
    with pytest.raises(ValidationError), pytest.warns(HypothesisWarning, match="pattern"):
        strategy.example()


@given(from_factory(MerchantFactory, seats=st.integers(min_value=1, max_value=100)))
def test_factory_fills_fields_hypothesis_cannot(merchant):
    assert isinstance(merchant.callback_url, HttpUrl)
    assert merchant.id >= 1
    assert 1 <= merchant.seats <= 100


@given(field(MerchantFactory, "seats"))
def test_field_helper_preserves_pydantic_bounds(seats):
    assert 1 <= seats <= 100


def test_factory_overrides_are_still_validated():
    with pytest.raises(ValidationError):
        MerchantFactory.build(seats=0)


def test_seed_random_reproduces_factory_offline():
    CouponFactory.seed_random(1234)
    first = CouponFactory.build()
    CouponFactory.seed_random(1234)
    second = CouponFactory.build()
    assert first == second
