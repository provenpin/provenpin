import moment from "moment-timezone";

export type Interval = { startMs: number; endMs: number };

export function parseLocal(input: string, zone: string): moment.Moment {
  return moment.tz(input, "YYYY-MM-DD HH:mm", zone);
}

export function fromUtcInstant(iso: string): moment.Moment {
  return moment.utc(iso);
}

export function toZone(m: moment.Moment, zone: string): moment.Moment {
  return m.clone().tz(zone);
}

export function formatWithZoneAbbrev(m: moment.Moment, zone: string): string {
  return m.clone().tz(zone).format("YYYY-MM-DD HH:mm z");
}

export function utcIso(m: moment.Moment): string {
  return m.clone().utc().toISOString();
}

export function businessInterval(
  dateYmd: string,
  zone: string,
  openHour: number,
  closeHour: number
): Interval {
  const start = moment.tz(`${dateYmd} ${pad2(openHour)}:00`, "YYYY-MM-DD HH:mm", zone);
  const end = moment.tz(`${dateYmd} ${pad2(closeHour)}:00`, "YYYY-MM-DD HH:mm", zone);
  return { startMs: start.valueOf(), endMs: end.valueOf() };
}

export function overlapHours(a: Interval, b: Interval): number {
  const start = Math.max(a.startMs, b.startMs);
  const end = Math.min(a.endMs, b.endMs);
  return end > start ? (end - start) / 3600000 : 0;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
