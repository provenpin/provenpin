import fakeredis, pytest
import tasks
from celery_app import app
from dedupe import IdempotencyLock

@pytest.fixture(autouse=True)
def eager():
    app.conf.update(task_always_eager=True, task_eager_propagates=True)
    yield
    app.conf.update(task_always_eager=False)

@pytest.fixture
def fake_redis(monkeypatch):
    fake = fakeredis.FakeRedis()
    fake.flushall()  # fakeredis instances may share data, so start clean
    monkeypatch.setattr(tasks, "get_lock", lambda: IdempotencyLock(fake))
    return fake

@pytest.fixture(autouse=True)
def gateway(monkeypatch):
    calls = []
    monkeypatch.setattr(tasks, "charge_gateway", lambda order_id, cents: calls.append(order_id))
    return calls

def test_runs_inline_in_eager_mode(fake_redis, gateway):
    assert tasks.record_payment.delay("o1", 500).get() == "charged"
    assert gateway == ["o1"]

def test_duplicate_is_skipped(fake_redis, gateway):
    # SET NX returns None (not False) on conflict, so the helper must coerce to bool
    assert tasks.record_payment.delay("o2", 500).get() == "charged"
    assert tasks.record_payment.delay("o2", 500).get() == "duplicate"
    assert gateway == ["o2"]

def test_lock_has_ttl(fake_redis, gateway):
    # without a TTL, a crashed worker would block this order forever
    tasks.record_payment.delay("o4", 500).get()
    assert 0 < fake_redis.ttl("idem:payment:o4") <= 3600

def test_failed_run_releases_claim(monkeypatch, fake_redis):
    calls = []
    def flaky(order_id, cents):
        calls.append(order_id)
        if len(calls) == 1:
            raise RuntimeError("gateway down")
    monkeypatch.setattr(tasks, "charge_gateway", flaky)
    with pytest.raises(RuntimeError):
        tasks.record_payment.delay("o3", 100).get()
    assert tasks.record_payment.delay("o3", 100).get() == "charged"
    assert len(calls) == 2
