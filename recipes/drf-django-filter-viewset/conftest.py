import django
from django.conf import settings

# Settings live in code, so the suite needs no settings module on disk.
# django.setup() must run after configure() so app models can be imported.
if not settings.configured:
    settings.configure(
        DEBUG=False,
        SECRET_KEY="test-only",
        ROOT_URLCONF="shop.api",
        INSTALLED_APPS=[
            "django.contrib.contenttypes",
            "django.contrib.auth",
            "rest_framework",
            "django_filters",
            "shop",
        ],
        DATABASES={
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": ":memory:",
            }
        },
        REST_FRAMEWORK={
            "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
            "PAGE_SIZE": 2,
        },
        USE_TZ=True,
        DEFAULT_AUTO_FIELD="django.db.models.BigAutoField",
    )
    django.setup()
