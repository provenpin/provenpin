from nacl import encoding
from nacl.secret import SecretBox
from nacl.signing import SigningKey, VerifyKey
from nacl.utils import random


def new_secret_key() -> bytes:
    return random(SecretBox.KEY_SIZE)


def encrypt(secret_key: bytes, plaintext: bytes) -> bytes:
    return bytes(SecretBox(secret_key).encrypt(plaintext))


def decrypt(secret_key: bytes, blob: bytes) -> bytes:
    return SecretBox(secret_key).decrypt(blob)


def new_signing_key() -> SigningKey:
    return SigningKey.generate()


def sign(signing_key: SigningKey, message: bytes) -> bytes:
    return bytes(signing_key.sign(message))


def verify(verify_key: VerifyKey, signed: bytes) -> bytes:
    return verify_key.verify(signed)


def encode_key(key, encoder: encoding.Encoder = encoding.Base64Encoder) -> bytes:
    return key.encode(encoder=encoder)


def decode_signing_key(
    encoded: bytes, encoder: encoding.Encoder = encoding.Base64Encoder
) -> SigningKey:
    return SigningKey(encoded, encoder=encoder)


def decode_verify_key(
    encoded: bytes, encoder: encoding.Encoder = encoding.Base64Encoder
) -> VerifyKey:
    return VerifyKey(encoded, encoder=encoder)
