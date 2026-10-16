from dataclasses import dataclass

from email_validator import EmailNotValidError, validate_email


class InvalidEmail(ValueError):
    pass


@dataclass(frozen=True)
class NormalizedEmail:
    address: str
    ascii_address: str | None
    local_part: str
    domain: str
    smtputf8: bool


def normalize_email(raw, *, allow_smtputf8=True, allow_display_name=False):
    try:
        info = validate_email(
            raw,
            check_deliverability=False,
            allow_smtputf8=allow_smtputf8,
            allow_display_name=allow_display_name,
        )
    except (EmailNotValidError, TypeError) as exc:
        raise InvalidEmail(str(exc)) from exc
    return NormalizedEmail(
        address=info.normalized,
        ascii_address=info.ascii_email,
        local_part=info.local_part,
        domain=info.domain,
        smtputf8=info.smtputf8,
    )


def storage_key(raw) -> str:
    info = normalize_email(raw)
    return info.ascii_address or info.address
