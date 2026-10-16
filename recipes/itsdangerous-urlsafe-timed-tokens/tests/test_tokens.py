import re

import pytest
from freezegun import freeze_time

from itsdangerous import BadSignature, SignatureExpired

import tokens


def test_roundtrip_within_max_age():
    with freeze_time("2026-01-01 00:00:00"):
        token = tokens.make_email_token(42)
    with freeze_time("2026-01-01 00:10:00"):
        assert tokens.confirm_email(token) == 42


def test_expiry_raises_and_is_a_bad_signature():
    with freeze_time("2026-01-01 00:00:00"):
        token = tokens.make_email_token(42)
    with freeze_time("2026-01-03 00:00:00"):
        with pytest.raises(SignatureExpired):
            tokens.confirm_email(token)
    # gotcha: SignatureExpired subclasses BadSignature, so catch it first
    assert issubclass(SignatureExpired, BadSignature)


def test_salts_keep_contexts_separate():
    token = tokens.make_email_token(42)
    with pytest.raises(BadSignature):
        tokens.load_reset_token(token, "unused-hash")


def test_token_is_url_safe():
    token = tokens.make_email_token(42)
    assert re.fullmatch(r"[A-Za-z0-9._-]+", token)
    assert not set(token) & set("+/=")
    assert "/reset?token=" + token


def test_reset_token_dies_when_password_changes():
    token = tokens.make_reset_token(7, "old-hash")
    assert tokens.load_reset_token(token, "old-hash") == 7
    with pytest.raises(BadSignature):
        tokens.load_reset_token(token, "new-hash")


def test_tampered_token_is_rejected():
    token = tokens.make_email_token(42)
    with pytest.raises(BadSignature):
        tokens.confirm_email(token[:-1] + ("A" if token[-1] != "A" else "B"))
