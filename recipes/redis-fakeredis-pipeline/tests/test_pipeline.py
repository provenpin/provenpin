import fakeredis
import pytest
import redis

from pipeline import make_server, transfer


def test_pipeline_buffers_then_executes_in_order():
    _, r, _ = make_server()
    with r.pipeline() as pipe:
        pipe.set("n", 1)
        pipe.incr("n")
        pipe.get("n")
        assert pipe.execute() == [True, 2, "2"]


def test_watch_turns_reads_into_immediate_calls():
    _, r, _ = make_server()
    r.set("k", "v")
    with r.pipeline() as pipe:
        pipe.watch("k")
        # while watching, commands run now instead of being queued
        assert pipe.get("k") == "v"
        assert pipe.command_stack == []
        pipe.multi()
        pipe.get("k")
        assert len(pipe.command_stack) == 1
        assert pipe.execute() == ["v"]


def test_watch_error_on_concurrent_write():
    _, r1, r2 = make_server()
    r1.set("balance", 10)
    with r1.pipeline() as pipe:
        pipe.watch("balance")
        r2.set("balance", 999)
        pipe.multi()
        pipe.set("balance", 0)
        with pytest.raises(redis.WatchError):
            pipe.execute()
    assert r1.get("balance") == "999"


def test_transfer_moves_funds_atomically():
    _, r, _ = make_server()
    r.mset({"a": 10, "b": 0})
    assert transfer(r, "a", "b", 4) is True
    assert r.mget("a", "b") == ["6", "4"]


def test_transfer_aborts_on_insufficient_funds():
    _, r, _ = make_server()
    r.set("a", 1)
    assert transfer(r, "a", "b", 5) is False
    assert r.get("a") == "1"


def test_default_instances_do_not_share_state():
    a = fakeredis.FakeRedis(decode_responses=True)
    b = fakeredis.FakeRedis(decode_responses=True)
    a.set("k", "v")
    assert b.get("k") is None
