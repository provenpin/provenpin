from blinker import Namespace

events = Namespace()

user_saved = events.signal("user-saved", "Sent after a user is persisted.")
user_deleted = events.signal("user-deleted", "Sent after a user is removed.")


class UserStore:
    """Emits named signals with itself as the sender."""

    def __init__(self, name: str):
        self.name = name

    def save(self, user_id: int, email: str):
        return user_saved.send(self, user_id=user_id, email=email)

    def delete(self, user_id: int):
        return user_deleted.send(self, user_id=user_id)


class AuditLog:
    """Records only the events of the stores it is subscribed to."""

    def __init__(self):
        self.entries: list[tuple[str, int, str | None]] = []

    def subscribe(self, store: UserStore):
        user_saved.connect(self.on_saved, sender=store)
        user_deleted.connect(self.on_deleted, sender=store)

    def on_saved(self, sender: UserStore, user_id: int, email: str):
        self.entries.append((sender.name, user_id, email))

    def on_deleted(self, sender: UserStore, user_id: int):
        self.entries.append((sender.name, user_id, None))
