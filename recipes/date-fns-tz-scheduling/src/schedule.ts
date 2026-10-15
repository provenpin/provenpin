import { addDays, differenceInHours, format, startOfDay } from "date-fns";
import { TZDate, tz } from "@date-fns/tz";

// "9am every day in the user's zone", stored as UTC ISO strings
export function dailyAt(zone: string, startIso: string, hour: number, days: number) {
  const start = startOfDay(new TZDate(startIso, zone));
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(start, i);
    d.setHours(hour, 0, 0, 0); // wall-clock hour in `zone`, even across DST
    return new Date(d.getTime()).toISOString();
  });
}

export const formatIn = (iso: string, zone: string, pattern = "yyyy-MM-dd HH:mm") => format(new TZDate(iso, zone), pattern);

// start of "today" for a user, as a UTC instant (for DB range queries)
export const startOfDayIn = (iso: string, zone: string) => new Date(startOfDay(iso, { in: tz(zone) }).getTime()).toISOString();

export const hoursBetweenMidnights = (zone: string, dayIso: string) => {
  const a = startOfDay(new TZDate(dayIso, zone));
  return differenceInHours(addDays(a, 1), a);
};
