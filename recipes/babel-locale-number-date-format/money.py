from babel.dates import format_date, format_datetime
from babel.numbers import format_currency, format_decimal, parse_decimal


def format_price(amount, currency, locale):
    return format_currency(amount, currency, locale=locale)


def format_quantity(value, locale):
    return format_decimal(value, locale=locale)


def parse_price(text, locale):
    return parse_decimal(text, locale=locale)


def format_day(value, locale):
    return format_date(value, format="long", locale=locale)


def format_stamp(value, locale, tzinfo=None):
    return format_datetime(value, format="short", locale=locale, tzinfo=tzinfo)
