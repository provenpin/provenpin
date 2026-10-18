import pytest
from joserfc.errors import BadSignatureError, ExpiredTokenError, UnsupportedKeyOperationError

from tokens import (
    ISSUER,
    decrypt_rsa_oaep,
    encrypt_rsa_oaep,
    issue_hs256,
    now,
    read_hs256,
    rsa_pair,
    sign_rs256,
    validate,
    verify_rs256,
)

SECRET = "a-32-byte-secret-used-only-in-tests!!"


@pytest.fixture(scope="module")
def rsa_keys():
    return rsa_pair()


def test_hs256_roundtrip_and_claims():
    token = issue_hs256({"iss": ISSUER, "sub": "u1", "exp": now() + 60}, SECRET)
    claims = read_hs256(token, SECRET)
    assert claims["sub"] == "u1" and claims["iss"] == ISSUER
    validate(claims)


def test_expired_token_is_rejected_by_registry():
    token = issue_hs256({"iss": ISSUER, "exp": now() - 1}, SECRET)
    claims = read_hs256(token, SECRET)
    with pytest.raises(ExpiredTokenError):
        validate(claims)


def test_wrong_secret_fails_signature():
    token = issue_hs256({"iss": ISSUER}, SECRET)
    with pytest.raises(BadSignatureError):
        read_hs256(token, SECRET + "x")


def test_rs256_verifies_with_public_key(rsa_keys):
    private, public = rsa_keys
    token = sign_rs256({"iss": ISSUER, "sub": "u1"}, private)
    assert verify_rs256(token, public)["sub"] == "u1"


def test_rsa_oaep_jwe_roundtrip(rsa_keys):
    private, public = rsa_keys
    token = encrypt_rsa_oaep({"iss": ISSUER, "exp": now() + 60}, public)
    assert token.count(".") == 4
    claims = decrypt_rsa_oaep(token, private)
    validate(claims)


def test_jwe_cannot_be_decrypted_with_public_key(rsa_keys):
    _, public = rsa_keys
    token = encrypt_rsa_oaep({"iss": ISSUER}, public)
    with pytest.raises(UnsupportedKeyOperationError):
        decrypt_rsa_oaep(token, public)
