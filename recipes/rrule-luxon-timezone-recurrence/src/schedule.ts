import rrulePkg from "rrule";
import { DateTime } from "luxon";

// rrule 2.8 ships a UMD "main" with no "exports" map, so Node ESM only sees a default export.
export const { RRule, rrulestr } = rrulePkg;
export type RRule = InstanceType<typeof rrulePkg.RRule>;

/**
 * rrule works in "floating" wall-clock time: build the rule with UTC fields equal to the local
 * wall time, then reinterpret each result in the real zone with luxon. That keeps "9:00 every
 * Monday" at 9:00 local across DST changes, independent of the machine TZ.
 */
const floating = (dt: DateTime) => new Date(Date.UTC(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute));
const toZone = (d: Date, zone: string) =>
  DateTime.fromObject(
    { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() },
    { zone },
  );

export function weekly(startLocalISO: string, zone: string, days: number[], count: number) {
  const start = DateTime.fromISO(startLocalISO, { zone });
  return new RRule({ freq: RRule.WEEKLY, byweekday: days, dtstart: floating(start), count });
}

export function occurrences(rule: RRule, zone: string) {
  return rule.all().map((d) => toZone(d, zone).toISO({ suppressMilliseconds: true }));
}

export function between(rule: RRule, zone: string, fromISO: string, toISO: string) {
  const from = floating(DateTime.fromISO(fromISO, { zone }));
  const to = floating(DateTime.fromISO(toISO, { zone }));
  return rule.between(from, to, true).map((d) => toZone(d, zone).toUTC().toISO({ suppressMilliseconds: true }));
}

export const describe = (rule: RRule) => rule.toText();
export const serialize = (rule: RRule) => rule.toString();
export const parse = (s: string) => rrulestr(s) as RRule;

/** Last business day of each month: BYDAY=MO..FR with BYSETPOS=-1. */
export function lastWeekdayOfMonth(year: number, months: number) {
  const r = new RRule({ freq: RRule.MONTHLY, byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR], bysetpos: -1, dtstart: new Date(Date.UTC(year, 0, 1)), count: months });
  return r.all().map((d) => d.toISOString().slice(0, 10));
}
