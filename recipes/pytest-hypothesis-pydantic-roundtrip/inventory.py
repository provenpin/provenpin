from collections import Counter

class Inventory:
    def __init__(self) -> None:
        self._qty: Counter[str] = Counter()

    def add(self, sku: str, qty: int) -> None:
        if qty <= 0:
            raise ValueError("qty must be positive")
        self._qty[sku] += qty

    def remove(self, sku: str, qty: int) -> None:
        if qty <= 0:
            raise ValueError("qty must be positive")
        if self._qty[sku] < qty:
            raise ValueError(f"only {self._qty[sku]} of {sku} in stock")
        self._qty[sku] -= qty
        if self._qty[sku] == 0:
            del self._qty[sku]

    def count(self, sku: str) -> int:
        return self._qty[sku]

    def total(self) -> int:
        return sum(self._qty.values())
