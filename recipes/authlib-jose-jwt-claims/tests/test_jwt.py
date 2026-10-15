import pytest
from authlib.jose import jwt
from authlib.jose.errors import (
    BadSignatureError,
    ExpiredTokenError,
    InvalidClaimError,
    MissingClaimError,
    UnsupportedAlgorithmError,
)

from jwt_utils import SECRET, issue_token, read_token

NOW = 1_700_000_000


def test_round_trip_keeps_custom_claims():
    token = issue_token("user:42", ["editor"], now=NOW)
    assert isinstance(token, str)
    claims = read_token(token, now=NOW)
    assert claims["sub"] == "user:42"
    assert claims["roles"] == ["editor"]


def test_decode_does_not_validate_exp():
    expired = issue_token("user:1", ["viewer"], ttl=-10, now=NOW)
    claims = jwt.decode(expired, SECRET)  # signature only, no error yet
    assert claims["exp"] < NOW
    with pytest.raises(ExpiredTokenError):
        read_token(expired, now=NOW)


def test_leeway_tolerates_clock_skew():
    token = issue_token("user:1", ["viewer"], ttl=5, now=NOW)
    with pytest.raises(ExpiredTokenError):
        read_token(token, now=NOW + 30)
    assert read_token(token, now=NOW + 30, leeway=60)["sub"] == "user:1"


def test_required_and_custom_claim_rules():
    bare = jwt.encode(
        {"alg": "HS256"},
        {"sub": "user:1", "iat": NOW, "exp": NOW + 60},
        SECRET,
    ).decode("ascii")
    with pytest.raises(MissingClaimError):
        read_token(bare, now=NOW)
    with pytest.raises(InvalidClaimError):
        read_token(issue_token("user:1", [123], now=NOW), now=NOW)


def test_wrong_audience_is_rejected():
    token = issue_token("user:1", ["viewer"], now=NOW, aud="someone-else")
    with pytest.raises(InvalidClaimError):
        read_token(token, now=NOW)


def test_tampering_and_none_alg_are_rejected():
    token = issue_token("user:1", ["viewer"], now=NOW)
    forged = jwt.encode(
        {"alg": "HS256"}, dict(jwt.decode(token, SECRET)), b"attacker-key"
    ).decode("ascii")
    with pytest.raises(BadSignatureError):
        read_token(forged, now=NOW)
    with pytest.raises(UnsupportedAlgorithmError):
        jwt.encode({"alg": "none"}, {"sub": "user:1"}, "")
