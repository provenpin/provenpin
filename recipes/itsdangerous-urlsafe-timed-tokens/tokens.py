import os

from itsdangerous import BadSignature, URLSafeTimedSerializer

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-secret")
EMAIL_SALT = "email-confirm-v1"
RESET_SALT = "password-reset-v1"
EMAIL_MAX_AGE = 60 * 60 * 24
RESET_MAX_AGE = 60 * 30


def _serializer(salt: str) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(secret_key=SECRET_KEY, salt=salt)


def make_email_token(user_id: int) -> str:
    return _serializer(EMAIL_SALT).dumps({"uid": user_id})


def confirm_email(token: str, max_age: int = EMAIL_MAX_AGE) -> int:
    data = _serializer(EMAIL_SALT).loads(token, max_age=max_age)
    return data["uid"]


def make_reset_token(user_id: int, password_hash: str) -> str:
    return _serializer(RESET_SALT).dumps({"uid": user_id, "ph": password_hash})


def load_reset_token(token: str, password_hash: str, max_age: int = RESET_MAX_AGE) -> int:
    data = _serializer(RESET_SALT).loads(token, max_age=max_age)
    if data["ph"] != password_hash:
        raise BadSignature("token was issued against an older password")
    return data["uid"]
