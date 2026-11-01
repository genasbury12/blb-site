import { TZDate } from "@date-fns/tz";
import { addMonths } from "date-fns";

/**
 * Coaching calendar rules (D11, D12, handoff 03). All instants are UTC Date objects;
 * rules are evaluated in the business time zone so daylight saving changes are handled.
 * These are configured defaults: admins can cancel or reschedule individual sessions,
 * and holiday exceptions are never auto-created (D12).
 */
export const BUSINESS_TZ = "America/New_York";

export const SCHEDULE_DEFAULTS = {
  groupCoaching: { weekday: 3 /* Wednesday */, hour: 13, minute: 0, durationMinutes: 60 },
  hotSeat: { weekday: 2 /* Tuesday */, nth: 2, hour: 13, minute: 0, durationMinutes: 90 },
  hotSeatApplicationsClose: { weekday: 2, nth: 1, hour: 13, minute: 0 },
  hotSeatSelectionNoticeHours: 48,
  workshopRelease: { weekday: 1 /* Monday */, nths: [1, 3] as const },
  elitePrivate: { durationMinutes: 60, rescheduleNoticeHours: 24 },
  feedback: { perCycle: 2, responseBusinessDays: 3 },
  eliteAuditBusinessDays: 7,
} as const;

/** A wall clock time in the business time zone, returned as a UTC instant. */
export function zonedInstant(year: number, monthIndex: number, day: number, hour = 0, minute = 0, tz = BUSINESS_TZ): Date {
  return new Date(new TZDate(year, monthIndex, day, hour, minute, 0, 0, tz).getTime());
}

/** Calendar parts of an instant as seen in the business time zone. */
export function zonedParts(at: Date, tz = BUSINESS_TZ) {
  const z = new TZDate(at.getTime(), tz);
  return { year: z.getFullYear(), monthIndex: z.getMonth(), day: z.getDate(), weekday: z.getDay(), hour: z.getHours(), minute: z.getMinutes() };
}

/** Day of month of the nth given weekday (1 based nth), for a month. */
export function nthWeekdayOfMonth(year: number, monthIndex: number, weekday: number, nth: number): number {
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  return 1 + offset + (nth - 1) * 7;
}

export type Occurrence = { startsAt: Date; endsAt: Date };

const minutes = (n: number) => n * 60_000;

/** Weekly group coaching occurrences starting at or after `from`. */
export function groupCoachingOccurrences(from: Date, count: number): Occurrence[] {
  const { weekday, hour, minute, durationMinutes } = SCHEDULE_DEFAULTS.groupCoaching;
  const p = zonedParts(from);
  const out: Occurrence[] = [];
  let dayOffset = (weekday - p.weekday + 7) % 7;
  while (out.length < count) {
    const start = zonedInstant(p.year, p.monthIndex, p.day + dayOffset, hour, minute);
    if (start.getTime() >= from.getTime()) out.push({ startsAt: start, endsAt: new Date(start.getTime() + minutes(durationMinutes)) });
    dayOffset += 7;
  }
  return out;
}

export type HotSeatMonth = {
  session: Occurrence;
  applicationsCloseAt: Date;
  selectionNoticeBy: Date;
};

export function hotSeatForMonth(year: number, monthIndex: number): HotSeatMonth {
  const { hotSeat, hotSeatApplicationsClose, hotSeatSelectionNoticeHours } = SCHEDULE_DEFAULTS;
  const sessionDay = nthWeekdayOfMonth(year, monthIndex, hotSeat.weekday, hotSeat.nth);
  const closeDay = nthWeekdayOfMonth(year, monthIndex, hotSeatApplicationsClose.weekday, hotSeatApplicationsClose.nth);
  const start = zonedInstant(year, monthIndex, sessionDay, hotSeat.hour, hotSeat.minute);
  const close = zonedInstant(year, monthIndex, closeDay, hotSeatApplicationsClose.hour, hotSeatApplicationsClose.minute);
  return {
    session: { startsAt: start, endsAt: new Date(start.getTime() + minutes(hotSeat.durationMinutes)) },
    applicationsCloseAt: close,
    selectionNoticeBy: new Date(close.getTime() + hotSeatSelectionNoticeHours * 3_600_000),
  };
}

/** Workshop release dates (first and third Monday), as the start of that day in the business zone. */
export function workshopReleaseDates(year: number, monthIndex: number): Date[] {
  const { weekday, nths } = SCHEDULE_DEFAULTS.workshopRelease;
  return nths.map((n) => zonedInstant(year, monthIndex, nthWeekdayOfMonth(year, monthIndex, weekday, n)));
}

/** ISO dates (YYYY-MM-DD) of published US holidays, supplied by admin configuration. */
export type HolidayCalendar = ReadonlySet<string>;

function isoDate(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isBusinessDay(year: number, monthIndex: number, day: number, holidays: HolidayCalendar): boolean {
  const wd = new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
  if (wd === 0 || wd === 6) return false;
  const d = new Date(Date.UTC(year, monthIndex, day));
  return !holidays.has(isoDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Due time `n` US business days after `from`, at the same wall clock time in the business zone,
 * skipping weekends and published holidays (D11).
 */
export function addBusinessDays(from: Date, n: number, holidays: HolidayCalendar = new Set()): Date {
  const p = zonedParts(from);
  let day = p.day;
  let added = 0;
  while (added < n) {
    day += 1;
    const d = new Date(Date.UTC(p.year, p.monthIndex, day));
    if (isBusinessDay(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), holidays)) added += 1;
  }
  return zonedInstant(p.year, p.monthIndex, day, p.hour, p.minute);
}

export type FeedbackCycle = { index: number; startsAt: Date; endsAt: Date };

/**
 * Monthly feedback cycle containing `at` (D11): cycles begin at the coaching activation instant
 * and repeat on monthly anniversaries in the business zone. Each anniversary is computed from the
 * activation (not chained), so a 31st activation clamps to short months without drifting.
 * Returns null before activation.
 */
export function feedbackCycleAt(activation: Date, at: Date): FeedbackCycle | null {
  if (at.getTime() < activation.getTime()) return null;
  const base = new TZDate(activation.getTime(), BUSINESS_TZ);
  const anniversary = (i: number) => new Date(addMonths(base, i).getTime());
  let index = 0;
  while (anniversary(index + 1).getTime() <= at.getTime()) index += 1;
  return { index, startsAt: anniversary(index), endsAt: anniversary(index + 1) };
}

/** Feedback quota (D11): 2 per cycle, no rollover. `usedInCycle` counts submissions in the current cycle only. */
export function feedbackRemaining(usedInCycle: number): number {
  return Math.max(0, SCHEDULE_DEFAULTS.feedback.perCycle - usedInCycle);
}

/** Elite private sessions: rescheduling needs at least 24 hours notice (D12). */
export function canRescheduleWithoutForfeit(sessionStartsAt: Date, now: Date): boolean {
  return sessionStartsAt.getTime() - now.getTime() >= SCHEDULE_DEFAULTS.elitePrivate.rescheduleNoticeHours * 3_600_000;
}
