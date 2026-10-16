from datetime import date
from decimal import Decimal

import pytest
from babel.numbers import NumberFormatError

from locales import decimal, long_date, money, parse_amount, percent


def test_currency_symbol_and_placement_vary_by_locale():
    assert money(1234.5, "USD", "en_US") == "$1,234.50"
    assert money(1234.5, "USD", "de_DE") == "1.234,50\u00a0$"
    assert money(1234.5, "USD", "fr_FR") == "1\u202f234,50\u00a0$US"


def test_currency_digits_follow_the_currency_not_the_locale():
    assert money(1234, "JPY", "en_US") == "\u00a51,234"
    assert money(1234, "JPY", "fr_FR") == "1\u202f234\u00a0JPY"


def test_percent_spacing_is_locale_specific():
    assert percent(0.256, "en_US") == "26%"
    assert percent(0.256, "de_DE") == "26\u00a0%"
    assert percent(0.256, "fr_FR") == "26\u00a0%"


def test_decimal_rounds_to_three_fraction_digits_unless_pinned():
    assert decimal(1.23456, "en_US") == "1.235"
    assert decimal(1.23456, "de_DE") == "1,235"
    assert decimal(1.23456, "fr_FR", pattern="#,##0.#####") == "1,23456"


def test_parse_decimal_is_strict_about_the_matching_locale():
    assert parse_amount("1.234,56", "de_DE") == Decimal("1234.56")
    # Gotcha: en_US treats "," as grouping, drops it, and returns 1.23456 with no error.
    assert parse_amount("1.234,56", "en_US") == Decimal("1.23456")
    # fr_FR groups with a narrow no-break space, so a "." group separator is invalid.
    with pytest.raises(NumberFormatError):
        parse_amount("1.234,56", "fr_FR")


def test_long_date_order_and_month_case():
    assert long_date(date(2024, 3, 5), "en_US") == "March 5, 2024"
    assert long_date(date(2024, 3, 5), "de_DE") == "5. M\u00e4rz 2024"
    assert long_date(date(2024, 3, 5), "fr_FR") == "5 mars 2024"
