import pytest
from pydantic import ValidationError

from factories import (
    Customer,
    CustomerFactory,
    ModelFactory,
    SeededCustomerFactory,
    reseed,
)


def test_type_generation_ignores_field_names():
    reseed(CustomerFactory, 1)
    assert "@" not in CustomerFactory.build().email  # str becomes pystr(), not an email

    reseed(SeededCustomerFactory, 1)
    assert "@" in SeededCustomerFactory.build().email  # Use(fake.email) instead


def test_seed_random_makes_batches_repeatable():
    first = [c.model_dump() for c in reseed(SeededCustomerFactory, 1234).batch(3)]
    second = [c.model_dump() for c in reseed(SeededCustomerFactory, 1234).batch(3)]
    assert first == second


def test_batch_resumes_the_faker_stream_without_a_reseed():
    reseed(SeededCustomerFactory, 7)
    a = SeededCustomerFactory.build().email
    b = SeededCustomerFactory.build().email
    assert a != b  # __random_seed__ only fires once, when the class is created


def test_field_constraints_are_enforced_while_generating():
    for customer in reseed(SeededCustomerFactory, 99).batch(25):
        assert 18 <= customer.age <= 99
        assert customer.plan in {"free", "pro"}
        assert len(customer.address.country_code) == 2
        assert customer.address.country_code.isupper()


def test_construct_build_bypasses_validation():
    with pytest.raises(ValidationError):
        SeededCustomerFactory.build(age=10)

    invalid = SeededCustomerFactory.build(factory_use_construct=True, age=10)
    assert invalid.age == 10  # model_construct() skips the ge=18 constraint


def test_default_faker_is_shared_so_seeding_leaks():
    other = ModelFactory.create_factory(Customer)
    assert other.__faker__ is CustomerFactory.__faker__

    a = [c.model_dump() for c in reseed(CustomerFactory, 11).batch(2)]
    b = [c.model_dump() for c in reseed(other, 11).batch(2)]
    assert a == b  # both draw from BaseFactory's single Faker instance

    assert SeededCustomerFactory.__faker__ is not CustomerFactory.__faker__
