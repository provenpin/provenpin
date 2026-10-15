from loguru import logger

def charge(order_id: str, amount_cents: int) -> bool:
    log = logger.bind(order_id=order_id, amount_cents=amount_cents)
    log.info("charging order")
    if amount_cents <= 0:
        log.warning("non-positive amount, skipped")
        return False
    log.success("charged")
    return True
