import pytest
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

from passwords import (
    bcrypt_ctx,
    hash_password,
    hash_scheme,
    needs_rehash,
    pepper,
    verify_password,
)

KEY = bytes(range(32))


def test_roundtrip_salts_each_hash():
    first = hash_password("correct horse battery staple", KEY)
    second = hash_password("correct horse battery staple", KEY)
    assert first != second
    assert verify_password("correct horse battery staple", first, KEY)
    assert not verify_password("wrong password", first, KEY)
    assert hash_scheme(first) == "bcrypt"


def test_pepper_avoids_the_72_byte_truncation_collision():
    base = "a" * 72
    left = hash_password(base + "LEFT", KEY)
    assert not verify_password(base + "RIGHT", left, KEY)
    raw = bcrypt_ctx.hash(base + "LEFT")
    assert bcrypt_ctx.verify(base + "RIGHT", raw)


def test_pepper_key_is_required_and_deterministic():
    stored = hash_password("hunter2", KEY)
    assert verify_password("hunter2", stored, KEY)
    assert not verify_password("hunter2", stored, bytes(32))
    assert pepper("hunter2", KEY) == pepper("hunter2", KEY)
    assert len(pepper("x" * 1000, KEY)) < 72


def test_verify_raises_for_unidentifiable_hashes():
    forged = "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$abcdef"
    assert hash_scheme(forged) is None
    with pytest.raises(UnknownHashError):
        verify_password("hunter2", forged, KEY)


def test_needs_rehash_tracks_work_factor():
    cheap_ctx = CryptContext(schemes=["bcrypt"], bcrypt__rounds=4)
    cheap = cheap_ctx.hash(pepper("hunter2", KEY))
    current = hash_password("hunter2", KEY)
    assert needs_rehash(cheap)
    assert not needs_rehash(current)
