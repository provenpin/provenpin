import pytest
from transitions import MachineError

from order import Order


def test_before_sees_old_state_after_sees_new_state():
    order = Order(items=2)
    assert order.place() is True
    order.pay(amount=25)
    assert order.ship() is True
    assert order.state == "shipped"
    assert order.amount == 25
    assert ("before_place", "cart") in order.log
    assert ("after_place", "placed") in order.log
    assert ("charge", "placed") in order.log
    assert ("paid", "paid") in order.log


def test_wrong_source_raises_machine_error():
    order = Order(items=1)
    with pytest.raises(MachineError, match="Can't trigger event ship"):
        order.ship()
    assert order.state == "cart"


def test_failed_condition_returns_false_without_raising():
    order = Order(items=0)
    assert order.may_place() is False
    assert order.place() is False
    assert order.state == "cart"
    assert order.log == []


def test_cancel_only_from_cart_or_placed():
    order = Order(items=1)
    order.place()
    order.pay()
    assert order.may_cancel() is False
    with pytest.raises(MachineError):
        order.cancel()
    assert order.state == "paid"


def test_auto_transitions_bypass_sources_and_conditions():
    order = Order(items=0)
    assert "to_shipped" in order.machine.get_triggers("cart")
    assert order.to_shipped() is True
    assert order.state == "shipped"
    assert order.log == []
