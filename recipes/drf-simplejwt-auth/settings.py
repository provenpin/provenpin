from datetime import timedelta

SECRET_KEY = "test-only-secret-key-not-for-production-use-0123456789abcdefghijklmnop"
DEBUG = False
ALLOWED_HOSTS = ["testserver"]
INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "rest_framework",
    "rest_framework_simplejwt",
]
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
ROOT_URLCONF = "urls"
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
}
SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(minutes=5)}
