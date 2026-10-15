from typing import Annotated

import phonenumbers
from phonenumbers import PhoneNumberFormat
from pydantic import AfterValidator, BaseModel, EmailStr


def _normalize_phone(value: str) -> str:
    try:
        # No default region: numbers must include a country code.
        num = phonenumbers.parse(value, None)
    except phonenumbers.NumberParseException as exc:
        # NumberParseException is not a ValueError, so pydantic would not
        # wrap it in ValidationError. Re-raise as ValueError.
        raise ValueError(str(exc)) from exc
    if not phonenumbers.is_valid_number(num):
        raise ValueError("invalid phone number")
    return phonenumbers.format_number(num, PhoneNumberFormat.E164)


Phone = Annotated[str, AfterValidator(_normalize_phone)]


class Contact(BaseModel):
    email: EmailStr
    phone: Phone
