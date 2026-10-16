from __future__ import annotations

from datetime import date
from decimal import Decimal

from babel.dates import format_date
from babel.numbers import format_currency, format_decimal, format_percent, parse_decimal

LOCALES = ("en_US", "de_DE", "fr_FR")


def money(amount: float | Decimal | int, currency: str, locale: str) -> str:
    # Babel moves the symbol around and may pick a disambiguated one per locale.
    return format_currency(amount, currency, locale=locale)


def percent(fraction: float | Decimal, locale: str) -> str:
    # Babel multiplies by 100 itself, pass the 0..1 fraction.
    return format_percent(fraction, locale=locale)


def decimal(value: float | Decimal, locale: str, pattern: str | None = None) -> str:
    # Default pattern is "#,##0.###", so it silently rounds to 3 fraction digits.
    return format_decimal(value, format=pattern, locale=locale)


def parse_amount(text: str, locale: str) -> Decimal:
    # Grouping and decimal symbols are taken from the locale, not guessed from text.
    return parse_decimal(text, locale=locale)


def long_date(value: date, locale: str) -> str:
    return format_date(value, format="long", locale=locale)
