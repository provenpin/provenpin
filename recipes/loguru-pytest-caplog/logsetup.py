import logging
from loguru import logger

logging.addLevelName(25, "SUCCESS")  # loguru's SUCCESS level has no stdlib name

def _to_stdlib(message):
    r = message.record
    logging.getLogger(r["name"]).log(
        r["level"].no,
        r["message"],  # already formatted; no %-formatting is applied without args
        # nest extras so bound keys like "message" or "name" cannot clash with LogRecord attributes
        extra={"loguru_extra": dict(r["extra"])},
    )

def setup_propagation(level="DEBUG") -> int:
    """Forward loguru records to stdlib logging. Returns the sink id for logger.remove()."""
    return logger.add(_to_stdlib, level=level)
