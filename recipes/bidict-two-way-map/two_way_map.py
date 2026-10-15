from bidict import ON_DUP_DROP_OLD, OrderedBidict


class NameRegistry:
    """Ordered two-way directory mapping usernames to numeric ids."""

    def __init__(self):
        self._names = OrderedBidict()

    def register(self, username, user_id):
        # DROP_OLD evicts any existing item that collides on key or value.
        self._names.put(username, user_id, on_dup=ON_DUP_DROP_OLD)

    def rename(self, username, new_user_id):
        # __setitem__ overwrites a duplicate key silently but still guards values.
        self._names[username] = new_user_id

    def id_of(self, username):
        return self._names[username]

    def name_of(self, user_id):
        return self._names.inverse[user_id]
