import pluggy
import pytest

from core import build_pm, process
from hookspecs import hookimpl
from plugins import (
    AuditLog,
    Enricher,
    FallbackScorer,
    FirstEnricher,
    Inner,
    LastEnricher,
    Outer,
    PriorityScorer,
    ScoreClamp,
)


def test_all_impls_run_in_lifo_order_unless_tryfirst_or_trylast_says_otherwise():
    pm = build_pm()
    pm.register(Enricher("a"))
    pm.register(Enricher("b"))
    pm.register(FirstEnricher())
    pm.register(LastEnricher())
    record = process(pm, {})
    assert record["order"] == ["first", "b", "a", "last"]


def test_firstresult_takes_first_non_none_and_falls_through_to_trylast():
    pm = build_pm()
    pm.register(PriorityScorer())
    pm.register(FallbackScorer())
    assert process(pm, {"priority": 7})["score"] == 7
    assert process(pm, {})["score"] == 1
    assert process(build_pm(), {})["score"] is None


def test_wrapper_can_transform_a_firstresult_value():
    pm = build_pm()
    pm.register(ScoreClamp())
    pm.register(PriorityScorer())
    assert process(pm, {"priority": 100})["score"] == 50


def test_tryfirst_wrapper_is_outermost_and_trylast_wrapper_is_innermost():
    pm = build_pm()
    log = []
    pm.register(AuditLog(log))
    pm.register(Inner(log))
    pm.register(Outer(log))
    process(pm, {})
    assert log == [
        "outer-before",
        "inner-before",
        "impl:processed",
        "inner-after",
        "outer-after",
    ]


def test_unknown_hookimpl_registers_silently_until_check_pending():
    class Rogue:
        @hookimpl
        def does_not_exist(self):
            return 1

    pm = build_pm()
    pm.register(Rogue())
    with pytest.raises(pluggy.PluginValidationError):
        pm.check_pending()


def test_optionalhook_lets_a_plugin_ahead_of_its_hookspec_register_cleanly():
    class Future:
        @hookimpl(optionalhook=True)
        def does_not_exist_yet(self):
            return 1

    pm = build_pm()
    pm.register(Future(), "future")
    assert pm.get_plugin("future").__class__ is Future
