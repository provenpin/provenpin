from calendar import monthrange
from datetime import date

from dateutil.relativedelta import relativedelta


def is_month_end(d: date) -> bool:
    return d.day == monthrange(d.year, d.month)[1]


def month_end(d: date) -> date:
    return d + relativedelta(day=31)


def add_months(d: date, months: int) -> date:
    return d + relativedelta(months=months)


def next_billing_date(anchor: date, n: int) -> date:
    d = anchor + relativedelta(months=n)
    if is_month_end(anchor):
        d = month_end(d)
    return d


def billing_cycle(anchor: date, n: int) -> tuple[date, date]:
    start = next_billing_date(anchor, n)
    end = next_billing_date(anchor, n + 1)
    return start, end
