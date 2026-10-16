from datetime import date

from billing import (
    add_months,
    billing_cycle,
    is_month_end,
    month_end,
    next_billing_date,
)


def test_add_months_clamps_to_month_end():
    assert add_months(date(2024, 1, 31), 1) == date(2024, 2, 29)
    assert add_months(date(2023, 1, 31), 1) == date(2023, 2, 28)


def test_day31_means_last_day_not_literal_31():
    assert month_end(date(2024, 2, 10)) == date(2024, 2, 29)
    assert month_end(date(2023, 2, 10)) == date(2023, 2, 28)


def test_iterative_addition_drifts_off_month_end():
    d = date(2024, 1, 31)
    for _ in range(2):
        d = add_months(d, 1)
    assert d == date(2024, 3, 29)
    assert not is_month_end(d)


def test_anchored_billing_keeps_month_end():
    anchor = date(2024, 1, 31)
    assert next_billing_date(anchor, 1) == date(2024, 2, 29)
    assert next_billing_date(anchor, 2) == date(2024, 3, 31)
    assert next_billing_date(anchor, 3) == date(2024, 4, 30)


def test_billing_cycle_bounds_are_half_open():
    start, end = billing_cycle(date(2024, 1, 31), 1)
    assert start == date(2024, 2, 29)
    assert end == date(2024, 3, 31)


def test_non_month_end_anchor_is_preserved():
    anchor = date(2024, 1, 15)
    assert next_billing_date(anchor, 1) == date(2024, 2, 15)
    assert next_billing_date(anchor, 2) == date(2024, 3, 15)
