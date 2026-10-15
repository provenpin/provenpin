import { DateTime, Interval, Duration, Settings } from "luxon";

Settings.throwOnInvalid = true; // fail loudly instead of producing Invalid DateTime

export const toZone = (iso: string, zone: string) => DateTime.fromISO(iso, { setZone: true }).setZone(zone);

export function isBusinessHours(isoUtc: string, zone: string) {
  const t = DateTime.fromISO(isoUtc, { zone: "utc" }).setZone(zone);
  return t.weekday <= 5 && t.hour >= 9 && t.hour < 17;
}

export const meetingsOverlap = (a: [string, string], b: [string, string]) =>
  Interval.fromISO(`${a[0]}/${a[1]}`).overlaps(Interval.fromISO(`${b[0]}/${b[1]}`));

export const humanDuration = (ms: number) => Duration.fromMillis(ms).shiftTo("hours", "minutes").toHuman({ unitDisplay: "short" });

export const addMonthsEndClamped = (iso: string, months: number) => DateTime.fromISO(iso, { zone: "utc" }).plus({ months }).toISODate();
