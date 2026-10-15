from datetime import UTC, datetime
from zoneinfo import ZoneInfo

import click
from dateutil.rrule import rrulestr


def next_runs(rule: str, tz_name: str, count: int = 3) -> list[datetime]:
    tz = ZoneInfo(tz_name)
    now = datetime.now(tz).replace(microsecond=0)
    rs = rrulestr(rule, dtstart=now)
    # rrule builds wall-clock datetimes, and a time inside a DST gap (02:30 on the
    # spring-forward day) resolves to a real instant. Round-tripping through UTC
    # makes that instant explicit and gives the correct local wall time.
    return [dt.astimezone(UTC).astimezone(tz) for dt in rs.xafter(now, count=count)]


@click.command()
@click.argument("rule")
@click.option("--tz", default="UTC", show_default=True, help="IANA time zone name.")
@click.option("-n", "--count", default=3, show_default=True, type=click.IntRange(min=1))
def main(rule: str, tz: str, count: int) -> None:
    """Print the next run times for an RFC 5545 RRULE, e.g. "FREQ=DAILY;BYHOUR=9"."""
    try:
        runs = next_runs(rule, tz, count)
    except (ValueError, KeyError) as exc:
        raise click.UsageError(str(exc)) from exc
    for run in runs:
        click.echo(run.isoformat())


if __name__ == "__main__":
    main()
