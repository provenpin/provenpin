import pytest
from hypothesis import HealthCheck, settings
from hypothesis import strategies as st
from hypothesis.errors import InvalidDefinition
from hypothesis.stateful import (
    Bundle,
    RuleBasedStateMachine,
    consumes,
    initialize,
    invariant,
    precondition,
    rule,
    run_state_machine_as_test,
)
from store import BoundedMap

SETTINGS = settings(
    max_examples=50,
    stateful_step_count=20,
    deadline=None,
    suppress_health_check=[HealthCheck.too_slow],
)


class LeakyMap(BoundedMap):
    def set(self, key: int, value: int) -> None:
        self._data[key] = value


class BoundedMapMachine(RuleBasedStateMachine):
    keys = Bundle("keys")
    store_factory = BoundedMap

    def __init__(self):
        super().__init__()
        self.store = type(self).store_factory(capacity=3)
        self.model: dict[int, int] = {}

    @initialize()
    def starts_empty(self):
        assert len(self.store) == 0

    @rule(key=st.integers(0, 4), value=st.integers(0, 100), target=keys)
    def set_key(self, key, value):
        self.store.set(key, value)
        if key not in self.model and len(self.model) >= self.store.capacity:
            del self.model[next(iter(self.model))]
        self.model[key] = value
        return key

    @rule(key=keys)
    def get_key(self, key):
        # bundle references outlive eviction, so skip keys the model dropped
        if key not in self.model:
            return
        assert self.store.get(key) == self.model[key]

    @rule(key=consumes(keys))
    def delete_key(self, key):
        if key not in self.model:
            return
        self.store.delete(key)
        del self.model[key]

    @precondition(lambda self: bool(self.model))
    @rule()
    def clear(self):
        for key in list(self.model):
            self.store.delete(key)
        self.model.clear()

    @invariant()
    def mirrors_model(self):
        assert set(self.store.keys()) == set(self.model)
        assert len(self.model) <= self.store.capacity


class LeakyMapMachine(BoundedMapMachine):
    store_factory = LeakyMap


def test_bounded_map_matches_model():
    run_state_machine_as_test(BoundedMapMachine, settings=SETTINGS)


def test_invariant_catches_model_drift():
    with pytest.raises(AssertionError):
        run_state_machine_as_test(LeakyMapMachine, settings=SETTINGS)


class BundleWithoutProducer(RuleBasedStateMachine):
    keys = Bundle("keys")
    reads = 0

    @rule(key=keys)
    def read(self, key):
        type(self).reads += 1

    @rule()
    def idle(self):
        pass


def test_bundle_rule_silently_skipped_when_empty():
    BundleWithoutProducer.reads = 0
    run_state_machine_as_test(BundleWithoutProducer, settings=SETTINGS)
    assert BundleWithoutProducer.reads == 0


class AllRulesBlocked(RuleBasedStateMachine):
    keys = Bundle("keys")

    @rule(key=keys)
    def read(self, key):
        pass


def test_no_progress_raises_invalid_definition():
    with pytest.raises(InvalidDefinition, match="No progress can be made"):
        run_state_machine_as_test(AllRulesBlocked, settings=SETTINGS)


class DefaultInitInvariant(RuleBasedStateMachine):
    checks = 0

    @initialize()
    def ready(self):
        self.flag = True

    @rule()
    def noop(self):
        pass

    @invariant()
    def flag_set(self):
        type(self).checks += 1
        assert getattr(self, "flag", False)


class EagerInitInvariant(DefaultInitInvariant):
    @invariant(check_during_init=True)
    def eager_flag_set(self):
        assert getattr(self, "flag", False)


def test_default_invariant_skips_initialize():
    DefaultInitInvariant.checks = 0
    run_state_machine_as_test(DefaultInitInvariant, settings=SETTINGS)
    assert DefaultInitInvariant.checks > 0


def test_check_during_init_runs_before_initialize():
    with pytest.raises(AssertionError):
        run_state_machine_as_test(EagerInitInvariant, settings=SETTINGS)
