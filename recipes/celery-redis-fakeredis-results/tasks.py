from celery_app import app
from dedupe import get_lock

def charge_gateway(order_id: str, cents: int) -> None:
    raise NotImplementedError("wire your payment provider here")

@app.task
def record_payment(order_id: str, cents: int) -> str:
    lock = get_lock()
    key = f"payment:{order_id}"
    if not lock.claim(key):
        return "duplicate"
    try:
        charge_gateway(order_id, cents)
    except Exception:
        lock.release(key)  # let a retry claim the key again
        raise
    return "charged"
