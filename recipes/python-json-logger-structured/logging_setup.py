import io
import json
import logging

from pythonjsonlogger.json import JsonFormatter

SERVICE = "checkout"


def build_formatter(**overrides):
    """Build the JSON formatter shared by the app's loggers.

    Extras let a caller tweak one option without rebuilding the whole config.
    """
    options = {
        "fmt": "%(message)s %(levelname)s %(name)s",
        "rename_fields": {"message": "msg", "levelname": "level"},
        "static_fields": {"service": SERVICE},
        "timestamp": "ts",
    }
    options.update(overrides)
    return JsonFormatter(**options)


def make_logger(name, **formatter_overrides):
    """Return an isolated logger plus the buffer it writes JSON lines to.

    logging.getLogger is global, so we replace handlers per test logger and
    disable propagation to keep other handlers out of the capture.
    """
    buf = io.StringIO()
    handler = logging.StreamHandler(buf)
    handler.setFormatter(build_formatter(**formatter_overrides))
    logger = logging.getLogger(name)
    logger.handlers[:] = [handler]
    logger.setLevel(logging.INFO)
    logger.propagate = False
    return logger, buf


def last_event(buf):
    """Parse the most recent JSON line emitted into buf."""
    line = buf.getvalue().strip().splitlines()[-1]
    return json.loads(line)
