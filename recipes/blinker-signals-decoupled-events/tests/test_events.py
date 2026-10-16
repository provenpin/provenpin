import gc

import pytest
from blinker import ANY, Namespace

from events import AuditLog, UserStore, events, user_saved


@pytest.fixture(autouse=True)
def isolate_named_signals():
    # named signals live in a global namespace, so leaked receivers follow
    # from one test to the next; _clear_state is blinker's test hook for this.
    yield
    for name in ("user-saved", "user-deleted"):
        events.signal(name)._clear_state()


def test_named_signals_are_singletons_per_namespace():
    assert events.signal("user-saved") is user_saved
    assert Namespace().signal("user-saved") is not user_saved


def test_sender_filtering_isolates_stores():
    a, b = UserStore("a"), UserStore("b")
    log = AuditLog()
    log.subscribe(a)
    a.save(1, "a@x")
    b.save(2, "b@x")
    a.delete(1)
    b.delete(2)
    assert log.entries == [("a", 1, "a@x"), ("a", 1, None)]


def test_any_receiver_gets_all_senders_and_send_returns_results():
    seen = []

    def sniff(sender, user_id, email):
        seen.append(sender.name)
        return user_id

    user_saved.connect(sniff, sender=ANY, weak=False)
    user_saved.connect(sniff, sender=ANY, weak=False)  # duplicate connect is a no-op
    results = UserStore("a").save(7, "a@x")
    assert seen == ["a"]
    assert results == [(sniff, 7)]


def test_local_handlers_are_weakly_referenced_by_default():
    calls = []

    def handler(sender, user_id, email):
        calls.append(user_id)

    user_saved.connect(handler)  # weak=True default
    del handler
    gc.collect()
    UserStore("a").save(1, "a@x")
    assert calls == []


def test_connected_to_and_muted_scope_the_handler_to_a_block():
    calls = []

    def handler(sender, user_id, email):
        calls.append(user_id)

    with user_saved.connected_to(handler):
        UserStore("a").save(1, "a@x")
    UserStore("a").save(2, "a@x")
    with user_saved.muted():
        UserStore("a").save(3, "a@x")
    assert calls == [1]
