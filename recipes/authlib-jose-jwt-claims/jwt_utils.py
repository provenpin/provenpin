import time

from authlib.jose import jwt

SECRET = b"dev-only-secret-rotate-me-before-prod"

CLAIMS_OPTIONS = {
    "sub": {
        "essential": True,
        "validate": lambda claims, value: isinstance(value, str) and value.startswith("user:"),
    },
    "roles": {
        "essential": True,
        "validate": lambda claims, value: isinstance(value, list)
        and all(isinstance(role, str) for role in value),
    },
    "aud": {"essential": True, "values": ["provenpin-api"]},
    "iat": {"essential": True},
    "exp": {"essential": True},
}


def issue_token(sub, roles, ttl=300, now=None, **extra):
    issued = int(time.time() if now is None else now)
    payload = {
        "sub": sub,
        "roles": roles,
        "aud": "provenpin-api",
        "iat": issued,
        "exp": issued + ttl,
    }
    payload.update(extra)
    # jwt.encode returns bytes, not str
    return jwt.encode({"alg": "HS256", "typ": "JWT"}, payload, SECRET).decode("ascii")


def read_token(token, now=None, leeway=0):
    claims = jwt.decode(token, SECRET, claims_options=CLAIMS_OPTIONS)
    # decode only verifies the signature, validate() applies the claims rules
    claims.validate(now=now, leeway=leeway)
    return dict(claims)
