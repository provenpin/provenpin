import base64

from cryptography.hazmat.primitives import hashes, hmac
from passlib.context import CryptContext

bcrypt_ctx = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12)


def pepper(password: str, key: bytes) -> bytes:
    h = hmac.HMAC(key, hashes.SHA256())
    h.update(password.encode("utf-8"))
    return base64.b64encode(h.finalize())


def hash_password(password: str, key: bytes) -> str:
    return bcrypt_ctx.hash(pepper(password, key))


def verify_password(password: str, stored_hash: str, key: bytes) -> bool:
    return bcrypt_ctx.verify(pepper(password, key), stored_hash)


def needs_rehash(stored_hash: str) -> bool:
    return bcrypt_ctx.needs_update(stored_hash)


def hash_scheme(stored_hash: str) -> str | None:
    return bcrypt_ctx.identify(stored_hash)
