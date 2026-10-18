from transitions import Machine


class Order:
    states = ["cart", "placed", "paid", "shipped", "cancelled"]

    def __init__(self, items=0):
        self.items = items
        self.amount = 0
        self.log = []
        self.machine = Machine(
            model=self,
            states=self.states,
            initial="cart",
            send_event=True,
        )
        self.machine.add_transition(
            "place", "cart", "placed",
            conditions="has_items",
            before="before_place",
            after="after_place",
        )
        self.machine.add_transition(
            "pay", "placed", "paid",
            before="charge",
            after="paid",
        )
        self.machine.add_transition(
            "ship", "paid", "shipped",
            after="shipped",
        )
        self.machine.add_transition(
            "cancel", ["cart", "placed"], "cancelled",
            after="cancelled",
        )

    def has_items(self, event):
        return self.items > 0

    def before_place(self, event):
        self.log.append(("before_place", self.state))

    def after_place(self, event):
        self.log.append(("after_place", self.state))

    def charge(self, event):
        self.amount = event.kwargs.get("amount", 0)
        self.log.append(("charge", self.state))

    def paid(self, event):
        self.log.append(("paid", self.state))

    def shipped(self, event):
        self.log.append(("shipped", self.state))

    def cancelled(self, event):
        self.log.append(("cancelled", self.state))
