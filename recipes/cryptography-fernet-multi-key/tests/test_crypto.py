import pytest
from cryptography.fernet import InvalidToken
from rotation import KeyRing, new_key


def test_roundtrip():
    ring = KeyRing.generate()
    assert ring.decrypt(ring.encrypt("secret")) == "secret"


def test_encrypt_is_nondeterministic():
    ring = KeyRing.generate()
    a, b = ring.encrypt("x"), ring.encrypt("x")
    assert a != b
    assert ring.decrypt(a) == ring.decrypt(b) == "x"


def test_old_key_still_decrypts_during_rotation():
    old = KeyRing.generate()
    token = old.encrypt("payload")
    ring = KeyRing([new_key(), *old.keys])
    assert ring.decrypt(token) == "payload"


def test_rotate_moves_token_to_primary_key():
    old = KeyRing.generate()
    token = old.encrypt("payload")
    ring = KeyRing([new_key(), *old.keys])
    rotated = ring.rotate(token)
    assert KeyRing([ring.keys[0]]).decrypt(rotated) == "payload"


def test_dropping_key_invalidates_old_tokens():
    old = KeyRing.generate()
    token = old.encrypt("payload")
    ring = KeyRing([new_key(), *old.keys])
    ring.drop(old.keys[0])
    with pytest.raises(InvalidToken):
        ring.decrypt(token)


def test_tampered_token_rejected():
    ring = KeyRing.generate()
    token = ring.encrypt("payload")
    bad = token[:-2] + ("AA" if token[-2:] != "AA" else "BB")
    with pytest.raises(InvalidToken):
        ring.decrypt(bad)
