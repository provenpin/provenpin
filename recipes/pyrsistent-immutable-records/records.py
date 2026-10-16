from pyrsistent import PMap, PRecord, PVector, field, freeze, pmap, pvector


class LineItem(PRecord):
    sku = field(str)
    qty = field(int, invariant=lambda q: (q > 0, "qty must be positive"))
    price_cents = field(int, invariant=lambda p: (p >= 0, "price must be >= 0"))

    @property
    def total_cents(self) -> int:
        return self.qty * self.price_cents


class Order(PRecord):
    order_id = field(str)
    lines = field(PVector, initial=pvector())
    meta = field(PMap, initial=pmap())

    __invariant__ = lambda self: (
        all(isinstance(line, LineItem) for line in self.lines),
        "lines must contain LineItem records",
    )

    @property
    def total_cents(self) -> int:
        return sum(line.total_cents for line in self.lines)


def add_line(order: Order, item: LineItem) -> Order:
    return order.set(lines=order.lines.append(item))


def retag(order: Order, **meta: str) -> Order:
    evolver = order.meta.evolver()
    for key, value in meta.items():
        evolver[key] = value
    return order.set(meta=evolver.persistent())


def snapshot(config: dict) -> PMap:
    return freeze(config)
