import phonenumbers
from phonenumbers import PhoneNumberFormat


def parse_valid(raw: str, region: str | None = None) -> phonenumbers.PhoneNumber:
    number = phonenumbers.parse(raw, region)
    if not phonenumbers.is_valid_number(number):
        raise ValueError(f"not a valid number: {raw!r}")
    return number


def to_e164(raw: str, region: str | None = None) -> str:
    return phonenumbers.format_number(parse_valid(raw, region), PhoneNumberFormat.E164)


def country_of(raw: str, region: str | None = None) -> str | None:
    return phonenumbers.region_code_for_number(parse_valid(raw, region))
