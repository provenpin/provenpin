import phonenumbers
import pytest
from phonenumbers import NumberParseException, PhoneNumberFormat

from phone import country_of, parse_valid, to_e164


def test_normalizes_national_number_to_e164():
    assert to_e164("(650) 253-0000", "US") == "+16502530000"
    assert to_e164("+16502530000") == "+16502530000"


def test_region_hint_required_when_plus_is_missing():
    with pytest.raises(NumberParseException) as exc:
        phonenumbers.parse("6502530000", None)
    assert exc.value.error_type == NumberParseException.INVALID_COUNTRY_CODE


def test_possible_is_not_the_same_as_valid():
    number = phonenumbers.parse("+11999999999", None)
    assert phonenumbers.is_possible_number(number)
    assert not phonenumbers.is_valid_number(number)
    with pytest.raises(ValueError):
        to_e164("+11999999999")


def test_free_text_raises_before_validation():
    with pytest.raises(NumberParseException) as exc:
        phonenumbers.parse("call me maybe", "US")
    assert exc.value.error_type == NumberParseException.NOT_A_NUMBER


def test_formats_and_region_for_gb_number():
    number = parse_valid("+442083661177")
    assert phonenumbers.format_number(number, PhoneNumberFormat.INTERNATIONAL) == "+44 20 8366 1177"
    assert phonenumbers.format_number(number, PhoneNumberFormat.NATIONAL) == "020 8366 1177"
    assert country_of("+442083661177") == "GB"


def test_non_geographic_numbers_report_region_001():
    assert country_of("+80012345678") == "001"
