from cryptography.fernet import Fernet, InvalidToken, MultiFernet


def new_key() -> str:
    return Fernet.generate_key().decode()


class KeyRing:
    def __init__(self, keys: list[str]):
        self.keys = list(keys)
        self._mf = MultiFernet([Fernet(k.encode()) for k in self.keys])

    @classmethod
    def generate(cls) -> "KeyRing":
        return cls([new_key()])

    def add(self, key: str) -> None:
        self.keys.insert(0, key)
        self._mf = MultiFernet([Fernet(k.encode()) for k in self.keys])

    def drop(self, key: str) -> None:
        self.keys.remove(key)
        self._mf = MultiFernet([Fernet(k.encode()) for k in self.keys])

    def encrypt(self, data: str) -> str:
        return self._mf.encrypt(data.encode()).decode()

    def decrypt(self, token: str) -> str:
        return self._mf.decrypt(token.encode()).decode()

    def rotate(self, token: str) -> str:
        return self._mf.rotate(token.encode()).decode()
