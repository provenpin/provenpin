import datetime

import pyotp

# RFC 4226/6238 test secret: base32 of the ASCII bytes of 12345678901234567890
SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"


def make_totp(
    secret: str = SECRET,
    issuer: str = "ProvenPin",
    account: str = "alice@example.com",
) -> pyotp.TOTP:
    return pyotp.TOTP(secret, issuer=issuer, name=account)


def make_hotp(secret: str = SECRET) -> pyotp.HOTP:
    return pyotp.HOTP(secret)


def instant(timestamp: int) -> datetime.datetime:
    # TOTP.now() feeds datetime.now() through time.mktime (local time), while
    # freeze_time() pins the local wall clock. Building the instant with
    # fromtimestamp() makes the frozen Unix timestamp match on any host TZ.
    return datetime.datetime.fromtimestamp(timestamp)
