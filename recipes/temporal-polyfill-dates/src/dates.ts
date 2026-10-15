import { Temporal } from "@js-temporal/polyfill";

export function addBusinessDays(isoDate: string, days: number) {
  let date = Temporal.PlainDate.from(isoDate);
  let remaining = days;
  const step = days >= 0 ? 1 : -1;
  while (remaining !== 0) {
    date = date.add({ days: step });
    const dow = date.dayOfWeek;
    if (dow !== 6 && dow !== 7) remaining -= step;
  }
  return date.toString();
}

export function daysBetween(a: string, b: string) {
  const start = Temporal.PlainDate.from(a);
  const end = Temporal.PlainDate.from(b);
  return start.until(end, { largestUnit: "day" }).days;
}

export function monthEnd(isoDate: string) {
  return Temporal.PlainDate.from(isoDate).with({ day: 1 }).add({ months: 1 }).subtract({ days: 1 }).toString();
}
