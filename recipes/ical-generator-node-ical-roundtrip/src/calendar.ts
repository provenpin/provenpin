import ical, { ICalEventRepeatingFreq, ICalAttendeeRole } from "ical-generator";
import nodeIcal, { type VEvent } from "node-ical";

export type Session = { id: string; title: string; start: Date; end: Date; location: string };

/** Build an .ics feed: one-off sessions plus a weekly recurring office hour with an exception date. */
export function buildCalendar(sessions: Session[]) {
  const cal = ical({ name: "Training Classes", prodId: { company: "provenpin", product: "recipes" }, timezone: "UTC" });
  for (const s of sessions) {
    cal.createEvent({
      id: s.id, start: s.start, end: s.end, summary: s.title, location: s.location,
      stamp: new Date("2026-10-01T00:00:00Z"),
      attendees: [{ email: "instructor@example.com", name: "Instructor", role: ICalAttendeeRole.CHAIR }],
    });
  }
  cal.createEvent({
    id: "office-hours", summary: "Office hours", stamp: new Date("2026-10-01T00:00:00Z"),
    start: new Date("2026-11-02T18:00:00Z"), end: new Date("2026-11-02T19:00:00Z"),
    repeating: { freq: ICalEventRepeatingFreq.WEEKLY, count: 4, exclude: [new Date("2026-11-16T18:00:00Z")] },
  });
  return cal.toString();
}

export function parseCalendar(ics: string) {
  const data = nodeIcal.sync.parseICS(ics);
  return Object.values(data)
    .filter((c): c is VEvent => c?.type === "VEVENT")
    .map((e) => ({
      uid: e.uid,
      summary: String(e.summary),
      start: new Date(e.start).toISOString(),
      end: e.end ? new Date(e.end).toISOString() : null,
      location: e.location ? String(e.location) : null,
      rrule: e.rrule ? e.rrule.toString() : null,
      // node-ical keys each EXDATE under more than one lookup key, so de-duplicate
      exdates: e.exdate ? [...new Set(Object.values(e.exdate).map((d) => new Date(d as Date).toISOString()))] : [],
      occurrences: e.rrule ? e.rrule.all().map((d) => d.toISOString()) : [],
    }));
}
