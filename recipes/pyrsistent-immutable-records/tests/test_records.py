import pytest
from pyrsistent import InvariantException, PMap, PTypeError, PVector, freeze, pvector, thaw

from records import LineItem, Order, add_line, retag, snapshot

ITEM = LineItem(sku="tea", qty=2, price_cents=350)


def test_records_are_immutable_and_hashable():
    original = Order(order_id="o1")
    updated = add_line(original, ITEM)

    assert updated.lines == pvector([ITEM]) and original.lines == pvector()
    with pytest.raises(AttributeError):
        original.order_id = "o2"
    assert len({ITEM, LineItem(sku="tea", qty=2, price_cents=350)}) == 1


def test_field_invariant_and_type_check_are_separate():
    with pytest.raises(InvariantException) as exc:
        LineItem(sku="tea", qty=0, price_cents=350)
    assert exc.value.invariant_errors == ("qty must be positive",)

    with pytest.raises(PTypeError):
        LineItem(sku="tea", qty="2", price_cents=350)


def test_global_invariant_runs_on_both_paths():
    with pytest.raises(InvariantException):
        Order(order_id="o1", lines=pvector(["not-a-line"]))

    valid = Order(order_id="o1", lines=pvector([ITEM]))
    with pytest.raises(InvariantException) as exc:
        valid.set(lines=pvector(["not-a-line"]))
    assert exc.value.invariant_errors == ("lines must contain LineItem records",)


def test_evolver_updates_meta_in_one_pass_and_shares_values():
    cart = freeze({"source": "web"})
    order = Order(order_id="o1", meta=freeze({"channel": "web", "cart": cart}))
    retagged = retag(order, channel="mobile", locale="en")

    assert retagged.meta["channel"] == "mobile"
    assert "locale" not in order.meta
    assert retagged.meta["cart"] is order.meta["cart"]


def test_structural_sharing_of_unchanged_elements():
    first, second = object(), object()
    base = pvector([first, second])
    extended = base.append(object())

    assert isinstance(extended, PVector)
    assert len(base) == 2 and len(extended) == 3
    assert extended[0] is first and extended[1] is second


def test_freeze_thaw_roundtrip():
    source = {"services": [{"name": "db", "port": 5432}], "debug": False}
    frozen = snapshot(source)
    source["debug"] = True

    assert isinstance(frozen, PMap)
    assert isinstance(frozen["services"], PVector)
    assert frozen["debug"] is False
    with pytest.raises(TypeError):
        frozen["debug"] = True

    plain = thaw(frozen)
    assert plain == {"services": [{"name": "db", "port": 5432}], "debug": False}
    assert type(plain) is dict
