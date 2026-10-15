SECRET_KEY = "test-only-not-secret"
INSTALLED_APPS = ["shop"]
DATABASES = {
    "default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"},
}
USE_TZ = True
