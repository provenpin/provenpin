from datetime import date, datetime, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo

from money import format_day, format_price, format_quantity, format_stamp, parse_price


def normalise(text):
    return text.replace("\u00a0", " ").replace("\u202f", " ")


def test_number_grouping_is_locale_specific():
    assert format_quantity(1234567.891, "en_US") == "1,234,567.891"
    assert format_quantity(1234567.891, "de_DE") == "1.234.567,891"


def test_currency_symbol_position_differs_by_locale():
    assert format_price(1234.5, "USD", "en_US") == "$1,234.50"
    assert normalise(format_price(1234.5, "USD", "de_DE")) == "1.234,50 $"


def test_currency_fraction_digits_follow_the_currency():
    assert format_price(1234.5, "USD", "en_US") == "$1,234.50"
    assert format_price(1234.5, "JPY", "ja_JP").endswith("1,234")


def test_parse_returns_decimal_and_depends_on_locale():
    assert parse_price("1.234,56", "de_DE") == Decimal("1234.56")
    assert parse_price("1,234.56", "en_US") == Decimal("1234.56")
    # the wrong locale silently reinterprets the separators instead of erroring
    assert parse_price("1,234.56", "de_DE") == Decimal("1.23456")


def test_dates_are_localised_per_locale():
    day = date(2024, 3, 15)
    assert format_day(day, "en_US") == "March 15, 2024"
    assert format_day(day, "fr_FR") == "15 mars 2024"
    assert format_day(day, "de_DE") == "15. M\u00e4rz 2024"


def test_datetime_is_converted_to_the_target_timezone():
    stamp = datetime(2024, 3, 15, 12, 30, tzinfo=timezone.utc)
    assert normalise(format_stamp(stamp, "en_US")) == "3/15/24, 12:30 PM"
    assert normalise(format_stamp(stamp, "en_US", ZoneInfo("America/New_York"))) == "3/15/24, 8:30 AM"
    assert format_stamp(stamp, "de_DE", ZoneInfo("Europe/Berlin")) == "15.03.24, 13:30"
