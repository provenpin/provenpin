import injector
import pytest
from injector import Binder, ClassAssistedBuilder, Injector, Module, singleton

from app import AppModule, EventStore, Report, Sink


class InMemoryStore:
    def __init__(self) -> None:
        self.kinds: list[str] = []

    def record(self, kind: str) -> int:
        self.kinds.append(kind)
        return len(self.kinds)

    def total(self) -> int:
        return len(self.kinds)


class TestModule(Module):
    def configure(self, binder: Binder) -> None:
        binder.bind(EventStore, to=InMemoryStore, scope=singleton)


def test_singleton_scope_is_per_injector():
    inj = Injector([AppModule()])
    store = inj.get(EventStore)
    store.record("login")
    assert inj.get(EventStore) is store
    assert Injector([AppModule()]).get(EventStore) is not store


def test_provider_builds_singleton_sink_from_settings():
    inj = Injector([AppModule()])
    sink = inj.get(Sink)
    sink.write("boot")
    assert inj.get(Sink) is sink
    assert sink.lines == ["evt: boot"]


def test_class_assisted_builder_injects_deps_and_takes_runtime_arg():
    inj = Injector([AppModule()])
    inj.get(EventStore).record("login")
    report = inj.get(ClassAssistedBuilder[Report]).build(label="weekly")
    assert report.render() == "weekly (1)"


def test_assisted_builder_requires_the_noinject_argument():
    inj = Injector([AppModule()])
    with pytest.raises(injector.CallError):
        inj.get(ClassAssistedBuilder[Report]).build()


def test_override_binding_with_a_module():
    inj = Injector([AppModule(), TestModule()])
    store = inj.get(EventStore)
    store.record("signup")
    assert isinstance(store, InMemoryStore)
    assert inj.get(EventStore) is store


def test_constructor_injection_needs_the_inject_decorator():
    class NeedsStore:
        def __init__(self, store: EventStore) -> None:
            self.store = store

    with pytest.raises(injector.CallError):
        Injector([AppModule()]).get(NeedsStore)
