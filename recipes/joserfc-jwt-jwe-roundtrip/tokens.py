import datetime as dt

from joserfc import jwt
from joserfc.jwe import JWERegistry
from joserfc.jwk import OctKey, RSAKey
from joserfc.jwt import JWTClaimsRegistry

ISSUER = "https://issuer.example"
JWE_REGISTRY = JWERegistry()


def now() -> int:
    return int(dt.datetime.now(dt.UTC).timestamp())


def issue_hs256(claims: dict, secret: str) -> str:
    return jwt.encode({"alg": "HS256"}, claims, OctKey.import_key(secret))


def read_hs256(token: str, secret: str) -> dict:
    return jwt.decode(token, OctKey.import_key(secret)).claims


def validate(claims: dict, issuer: str = ISSUER) -> None:
    JWTClaimsRegistry(
        iss={"essential": True, "value": issuer},
        exp={"essential": True},
    ).validate(claims)


def rsa_pair(size: int = 2048) -> tuple[RSAKey, RSAKey]:
    private = RSAKey.generate_key(size)
    public = RSAKey.import_key(private.as_dict(private=False))
    return private, public


def sign_rs256(claims: dict, private: RSAKey) -> str:
    return jwt.encode({"alg": "RS256"}, claims, private)


def verify_rs256(token: str, public: RSAKey) -> dict:
    return jwt.decode(token, public).claims


def encrypt_rsa_oaep(claims: dict, public: RSAKey) -> str:
    header = {"alg": "RSA-OAEP", "enc": "A256GCM"}
    return jwt.encode(header, claims, public, registry=JWE_REGISTRY)


def decrypt_rsa_oaep(token: str, private: RSAKey) -> dict:
    return jwt.decode(token, private, registry=JWE_REGISTRY).claims
