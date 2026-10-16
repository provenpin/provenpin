import time

from boltons.cacheutils import cachedmethod, cachedproperty
from boltons.funcutils import wraps


class RetryError(Exception):
    """Raised when a retried callable exhausts every attempt."""


def retry(attempts=3, retry_on=Exception, delay=0.0, sleep=time.sleep):
    """Signature-preserving retry decorator built on boltons.funcutils.wraps.

    Calls the wrapped function up to *attempts* times, retrying only when an
    exception matching *retry_on* is raised. The final failure is re-raised as
    a RetryError whose __cause__ is the last original exception.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last = None
            for attempt in range(attempts):
                try:
                    return func(*args, **kwargs)
                except retry_on as exc:
                    last = exc
                    if attempt < attempts - 1:
                        sleep(delay)
            raise RetryError(f"{func.__name__} failed after {attempts} attempts") from last
        return wrapper
    return decorator


class Rollup:
    """In-memory aggregator showing boltons cachedproperty and cachedmethod."""

    def __init__(self, values):
        self.values = list(values)
        self.calls = {"total": 0, "bucket": 0}
        self._buckets = {}

    @cachedproperty
    def total(self):
        self.calls["total"] += 1
        return sum(self.values)

    @cachedmethod("_buckets")
    def bucket(self, width):
        self.calls["bucket"] += 1
        return self.total // width


class Slotted:
    __slots__ = ("x",)

    def __init__(self, x):
        self.x = x

    @cachedproperty
    def doubled(self):
        return self.x * 2
