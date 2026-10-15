import * as chrono from "chrono-node";

/**
 * Parse natural-language dates against a fixed reference instant and timezone offset
 * (minutes from UTC), so results never depend on the machine clock or TZ.
 */
export function parseWhen(text: string, ref: Date, tzOffsetMinutes: number, forwardDate = true) {
  const results = chrono.parse(text, { instant: ref, timezone: tzOffsetMinutes }, { forwardDate });
  return results.map((r) => ({
    text: r.text,
    index: r.index,
    start: r.start.date().toISOString(),
    end: r.end?.date().toISOString() ?? null,
    certainHour: r.start.isCertain("hour"),
  }));
}

export const parseOne = (text: string, ref: Date, tz: number) => chrono.parseDate(text, { instant: ref, timezone: tz }, { forwardDate: true })?.toISOString() ?? null;

/** British-style day/month input via the en.GB locale parser. */
export const parseGB = (text: string, ref: Date) => chrono.en.GB.parseDate(text, { instant: ref, timezone: 0 })?.toISOString() ?? null;
