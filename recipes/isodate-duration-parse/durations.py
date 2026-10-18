from datetime import date, datetime, timedelta

import isodate
from isodate import Duration


def parse_duration(text: str) -> timedelta | Duration:
    return isodate.parse_duration(text)


def format_duration(value: timedelta | Duration) -> str:
    return isodate.duration_isoformat(value)


def shift(moment: date | datetime, text: str) -> date | datetime:
    return moment + isodate.parse_duration(text)


def parse_instant(text: str) -> datetime:
    return isodate.parse_datetime(text)
