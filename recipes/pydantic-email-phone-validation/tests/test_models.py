import pytest
from pydantic import ValidationError

from models import Contact


def test_normalizes_phone_to_e164():
    c = Contact(email="ada@example.com", phone="+1 650 253 0000")
    assert c.phone == "+16502530000"


def test_email_requires_dotted_domain():
    # email-validator rejects domains without a period, e.g. "localhost".
    with pytest.raises(ValidationError):
        Contact(email="ada@localhost", phone="+1 650 253 0000")


def test_unparseable_phone_is_validation_error():
    # phonenumbers raises NumberParseException, which must surface as ValidationError.
    with pytest.raises(ValidationError) as info:
        Contact(email="ada@example.com", phone="call me")
    assert "phone" in str(info.value)


def test_national_number_without_region_rejected():
    with pytest.raises(ValidationError):
        Contact(email="ada@example.com", phone="650 253 0000")


def test_invalid_phone_rejected():
    with pytest.raises(ValidationError):
        Contact(email="ada@example.com", phone="+1 650 253 000")
