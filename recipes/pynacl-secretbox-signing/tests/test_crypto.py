import pytest
from nacl import encoding
from nacl.exceptions import BadSignatureError, CryptoError
from nacl.secret import SecretBox
from nacl.utils import random

from crypto import (
    decode_signing_key,
    decode_verify_key,
    decrypt,
    encode_key,
    encrypt,
    new_secret_key,
    new_signing_key,
    sign,
    verify,
)


def test_secretbox_roundtrip_and_blob_layout():
    key = new_secret_key()
    blob = encrypt(key, b"attack at dawn")
    assert decrypt(key, blob) == b"attack at dawn"

    box = SecretBox(key)
    enc = box.encrypt(b"attack at dawn", random(SecretBox.NONCE_SIZE))
    assert bytes(enc) == enc.nonce + enc.ciphertext
    with pytest.raises(CryptoError):
        box.decrypt(bytes(enc), enc.nonce)
    assert box.decrypt(enc.ciphertext, enc.nonce) == b"attack at dawn"


def test_secretbox_tamper_detected():
    key = new_secret_key()
    blob = bytearray(encrypt(key, b"transfer $10"))
    blob[-1] ^= 0x01
    with pytest.raises(CryptoError):
        decrypt(key, bytes(blob))
    with pytest.raises(CryptoError):
        decrypt(new_secret_key(), encrypt(key, b"transfer $10"))


def test_secretbox_nonce_rules():
    key = new_secret_key()
    box = SecretBox(key)
    nonce = random(SecretBox.NONCE_SIZE)
    assert bytes(box.encrypt(b"same", nonce)) == bytes(box.encrypt(b"same", nonce))
    assert bytes(box.encrypt(b"same")) != bytes(box.encrypt(b"same", nonce))
    with pytest.raises(ValueError):
        box.encrypt(b"data", b"too-short")


def test_ed25519_sign_verify_and_message_layout():
    sk = new_signing_key()
    sm = sk.sign(b"release v1")
    assert bytes(sm) == sm.signature + sm.message
    assert len(sm.signature) == 64
    assert verify(sk.verify_key, bytes(sm)) == b"release v1"
    assert sk.verify_key.verify(sm.message, sm.signature) == b"release v1"


def test_ed25519_tamper_detected():
    sk = new_signing_key()
    signed = bytearray(sign(sk, b"pay bob $5"))
    signed[-1] ^= 0x01
    with pytest.raises(BadSignatureError):
        verify(sk.verify_key, bytes(signed))
    with pytest.raises(BadSignatureError):
        verify(new_signing_key().verify_key, sign(sk, b"pay bob $5"))


def test_key_encoding_roundtrip():
    sk = new_signing_key()
    restored = decode_signing_key(encode_key(sk))
    assert restored.verify_key.encode() == sk.verify_key.encode()
    assert sign(restored, b"hi") == sign(sk, b"hi")

    vk = sk.verify_key
    hex_vk = encode_key(vk, encoding.HexEncoder)
    assert decode_verify_key(hex_vk, encoding.HexEncoder).encode() == vk.encode()
