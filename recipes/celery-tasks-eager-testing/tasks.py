from celery import Celery, chain, group

app = Celery("tasks", broker="memory://", backend="cache+memory://")

@app.task
def add(x, y):
    return x + y

@app.task
def double(x):
    return x * 2

def add_then_double(x, y):
    return chain(add.s(x, y), double.s())

def sum_of_doubles(nums):
    # fan out with a group, then reduce the results
    return sum(group(double.s(n) for n in nums).apply_async().get())
