import email_validator.deliverability
import pytest

from emails import InvalidEmail, normalize_email, storage_key


def test_role_mailbox_local_part_is_lowercased():
    assert normalize_email("POSTMASTER@Example.COM").address == "postmaster@example.com"
    assert normalize_email("User@Example.COM").address == "User@example.com"


def test_idn_domain_round_trips_to_unicode():
    unicode_form = normalize_email("user@münchen.de")
    punycode_form = normalize_email("user@xn--mnchen-3ya.de")
    assert unicode_form.address == punycode_form.address == "user@münchen.de"
    assert unicode_form.ascii_address == "user@xn--mnchen-3ya.de"
    assert storage_key("user@münchen.de") == "user@xn--mnchen-3ya.de"


def test_smtputf8_local_part_has_no_ascii_form():
    info = normalize_email("пользователь@example.com")
    assert info.smtputf8 is True and info.ascii_address is None
    assert storage_key("пользователь@example.com") == "пользователь@example.com"
    with pytest.raises(InvalidEmail):
        normalize_email("пользователь@example.com", allow_smtputf8=False)


def test_bad_input_is_always_an_invalid_email_error():
    for raw in ["not-an-email", "a@b", "user@example.com.", None, 42]:
        with pytest.raises(InvalidEmail):
            normalize_email(raw)


def test_display_name_is_stripped():
    info = normalize_email("John Doe <john@example.com>", allow_display_name=True)
    assert info.address == "john@example.com"


def test_offline_never_touches_dns(monkeypatch):
    def boom(*args, **kwargs):
        raise AssertionError("DNS lookup attempted")

    monkeypatch.setattr(
        email_validator.deliverability, "validate_email_deliverability", boom
    )
    assert normalize_email("user@example.com").address == "user@example.com"
