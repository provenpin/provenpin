import time
from urllib.parse import parse_qs, unquote, urlparse

import pytest
from freezegun import freeze_time

from otp import SECRET, instant, make_hotp, make_totp


def test_totp_matches_rfc6238_vectors():
    otp = make_totp()
    assert otp.at(59) == "287082"
    assert otp.at(1111111109) == "081804"
    assert otp.at(1234567890) == "005924"


@freeze_time(instant(1111111109))
def test_frozen_now_matches_rfc6238_vector():
    assert make_totp().now() == "081804"


def test_frozen_now_is_timezone_independent(monkeypatch):
    if not hasattr(time, "tzset"):
        pytest.skip("tzset is POSIX only")
    monkeypatch.setenv("TZ", "Asia/Kolkata")
    time.tzset()
    try:
        with freeze_time(instant(59)):
            assert make_totp().now() == "287082"
    finally:
        monkeypatch.undo()
        time.tzset()


def test_valid_window_accepts_one_step_of_drift():
    otp = make_totp()
    code = otp.at(1111111109)
    with freeze_time(instant(1111111109 + 30)):
        assert otp.verify(code, valid_window=1) is True
        assert otp.verify(code, valid_window=0) is False


def test_hotp_counter_advances_rfc4226_vectors():
    hotp = make_hotp()
    assert hotp.at(0) == "755224"
    assert hotp.verify("287082", 1) is True
    assert hotp.verify("755224", 1) is False


def test_provisioning_uri_encodes_issuer_and_account():
    uri = make_totp(issuer="ProvenPin", account="alice@example.com").provisioning_uri()
    parsed = urlparse(uri)
    query = parse_qs(parsed.query)
    assert parsed.scheme == "otpauth" and parsed.netloc == "totp"
    assert query["secret"] == [SECRET]
    assert query["issuer"] == ["ProvenPin"]
    assert unquote(parsed.path.lstrip("/")) == "ProvenPin:alice@example.com"
