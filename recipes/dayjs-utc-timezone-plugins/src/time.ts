import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import duration from "dayjs/plugin/duration.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

export function parseLocal(input: string, tz: string) {
  return dayjs.tz(input, "YYYY-MM-DD HH:mm", tz);
}

export function toUtcIso(input: string, tz: string) {
  return parseLocal(input, tz).utc().toISOString();
}

export function shiftBusinessHours(startIso: string, hours: number) {
  return dayjs.utc(startIso).add(dayjs.duration({ hours })).toISOString();
}

export function describeFrom(fromIso: string, toIso: string) {
  return dayjs.utc(fromIso).from(dayjs.utc(toIso), true);
}
