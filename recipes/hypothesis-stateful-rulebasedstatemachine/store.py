from collections import OrderedDict


class BoundedMap:
    def __init__(self, capacity: int = 3):
        self.capacity = capacity
        self._data: OrderedDict[int, int] = OrderedDict()

    def set(self, key: int, value: int) -> None:
        if key not in self._data and len(self._data) >= self.capacity:
            self._data.popitem(last=False)
        self._data[key] = value

    def get(self, key: int):
        return self._data.get(key)

    def delete(self, key: int) -> None:
        self._data.pop(key, None)

    def keys(self):
        return list(self._data)

    def __len__(self) -> int:
        return len(self._data)
