from datetime import datetime, timedelta, timezone

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def generate_keypair() -> tuple[bytes, bytes]:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem, public_pem


def issue_token(private_pem: bytes, subject: str, audience: str, ttl: int = 300, kid: str | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": subject, "aud": audience, "iat": now, "exp": now + timedelta(seconds=ttl)}
    headers = {"kid": kid} if kid else None
    # PyJWT 2.x returns str (not bytes) and converts datetime claims to integer timestamps
    return jwt.encode(payload, private_pem, algorithm="RS256", headers=headers)


def verify_token(public_pem: bytes, token: str, audience: str) -> dict:
    # Always pass an explicit algorithm allowlist, never the key's type alone
    return jwt.decode(
        token,
        public_pem,
        algorithms=["RS256"],
        audience=audience,
        options={"require": ["exp", "iat", "sub"]},
    )
