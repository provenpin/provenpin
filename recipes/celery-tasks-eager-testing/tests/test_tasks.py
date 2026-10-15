import pytest
from tasks import app, add, add_then_double, sum_of_doubles

@pytest.fixture(autouse=True)
def eager():
    app.conf.update(task_always_eager=True, task_eager_propagates=True)
    yield
    app.conf.update(task_always_eager=False)

def test_delay():
    assert add.delay(2, 3).get() == 5

def test_chain():
    assert add_then_double(2, 3).apply_async().get() == 10

def test_group():
    assert sum_of_doubles([1, 2, 3]) == 12

def test_errors_propagate():
    with pytest.raises(TypeError):
        add.delay(1, "a").get()
