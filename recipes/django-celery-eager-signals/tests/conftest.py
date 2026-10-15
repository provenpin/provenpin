import pytest

from celery_app import app


@pytest.fixture(autouse=True)
def eager_celery():
    app.conf.update(task_always_eager=True, task_eager_propagates=True)
    yield
    app.conf.update(task_always_eager=False)
