import base64
import json

import jwt
import pytest

from auth import generate_keypair, issue_token, verify_token


@pytest.fixture(scope="module")
def keys():
    return generate_keypair()


def _b64(obj) -> str:
    return base64.urlsafe_b64encode(json.dumps(obj).encode()).rstrip(b"=").decode()


def test_roundtrip_rs256(keys):
    priv, pub = keys
    token = issue_token(priv, "alice", "api", kid="k1")
    assert isinstance(token, str)
    assert jwt.get_unverified_header(token) == {"alg": "RS256", "typ": "JWT", "kid": "k1"}
    assert verify_token(pub, token, "api")["sub"] == "alice"


def test_audience_is_enforced(keys):
    priv, pub = keys
    token = issue_token(priv, "alice", "api")
    # A token carrying "aud" is rejected when the verifier does not expect one
    with pytest.raises(jwt.InvalidAudienceError):
        jwt.decode(token, pub, algorithms=["RS256"])
    with pytest.raises(jwt.InvalidAudienceError):
        verify_token(pub, token, "other")


def test_expired_token_rejected(keys):
    priv, pub = keys
    token = issue_token(priv, "alice", "api", ttl=-5)
    with pytest.raises(jwt.ExpiredSignatureError):
        verify_token(pub, token, "api")


def test_unsigned_none_token_rejected(keys):
    _, pub = keys
    token = f"{_b64({'alg': 'none', 'typ': 'JWT'})}.{_b64({'sub': 'mallory', 'aud': 'api'})}."
    with pytest.raises(jwt.InvalidAlgorithmError):
        verify_token(pub, token, "api")


def test_algorithms_argument_is_required(keys):
    priv, pub = keys
    token = issue_token(priv, "alice", "api")
    # Omitting the allowlist lets the library choose the algorithm, which is unsafe
    with pytest.raises(jwt.DecodeError):
        jwt.decode(token, pub, audience="api")


def test_token_from_foreign_key_rejected(keys):
    _, pub = keys
    other_priv, _ = generate_keypair()
    forged = issue_token(other_priv, "mallory", "api")
    with pytest.raises(jwt.InvalidSignatureError):
        verify_token(pub, forged, "api")
