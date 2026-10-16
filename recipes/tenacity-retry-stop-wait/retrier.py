from tenacity import (
    Retrying,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    wait_none,
)


class TransientError(Exception):
    pass


class FatalError(Exception):
    pass


def build_retryer(max_attempts=3, *, no_wait=True, reraise=True):
    return Retrying(
        stop=stop_after_attempt(max_attempts),
        wait=wait_none() if no_wait else wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(TransientError),
        reraise=reraise,
    )


def run_with_retry(fn, *args, max_attempts=3, no_wait=True, **kwargs):
    return build_retryer(max_attempts, no_wait=no_wait)(fn, *args, **kwargs)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_none(),
    retry=retry_if_exception_type(TransientError),
    reraise=True,
)
def reload_config(loader, *args, **kwargs):
    return loader(*args, **kwargs)
