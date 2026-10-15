import asyncio

import dramatiq
from dramatiq.brokers.stub import StubBroker
from dramatiq.middleware.asyncio import AsyncIO
from dramatiq.results import Results
from dramatiq.results.backends.stub import StubBackend

broker = StubBroker()
broker.add_middleware(AsyncIO())
broker.add_middleware(Results(backend=StubBackend()))
dramatiq.set_broker(broker)


@dramatiq.actor(store_results=True)
def add(x, y):
    return x + y


@dramatiq.actor
def square(x):
    return x * x


@dramatiq.actor(store_results=True, max_retries=0)
def divide(x, y):
    return x / y


@dramatiq.actor(store_results=True)
async def upper(text):
    await asyncio.sleep(0)
    return text.upper()
