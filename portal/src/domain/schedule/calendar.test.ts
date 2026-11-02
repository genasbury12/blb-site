import { describe, expect, it } from "vitest";
import {
  addBusinessDays,
  canRescheduleWithoutForfeit,
  feedbackCycleAt,
  feedbackRemaining,
  groupCoachingOccurrences,
  hotSeatForMonth,
  nthWeekdayOfMonth,
  workshopReleaseDates,
  zonedParts,
} from "./calendar";

const iso = (d: Date) => d.toISOString();

describe("group coaching: Wednesdays 1 PM America/New_York, 60 minutes", () => {
  it("lands at 18:00 UTC in winter and 17:00 UTC in summer", () => {
    const [winter] = groupCoachingOccurrences(new Date("2027-01-04T00:00:00Z"), 1);
    expect(iso(winter!.startsAt)).toBe("2027-01-06T18:00:00.000Z");
    expect(iso(winter!.endsAt)).toBe("2027-01-06T19:00:00.000Z");
    const [summer] = groupCoachingOccurrences(new Date("2027-07-05T00:00:00Z"), 1);
    expect(iso(summer!.startsAt)).toBe("2027-07-07T17:00:00.000Z");
  });

  it("crosses the March daylight saving change correctly", () => {
    const sessions = groupCoachingOccurrences(new Date("2027-03-08T00:00:00Z"), 2);
    expect(sessions.map((s) => iso(s.startsAt))).toEqual(["2027-03-10T18:00:00.000Z", "2027-03-17T17:00:00.000Z"]);
    for (const s of sessions) expect(zonedParts(s.startsAt)).toMatchObject({ weekday: 3, hour: 13, minute: 0 });
  });

  it("does not return a session that already started", () => {
    const [next] = groupCoachingOccurrences(new Date("2027-01-06T18:00:01Z"), 1);
    expect(iso(next!.startsAt)).toBe("2027-01-13T18:00:00.000Z");
  });
});

describe("monthly Hot Seat", () => {
  it("is the second Tuesday at 1 PM for 90 minutes; applications close the first Tuesday at 1 PM; notice within 48 hours", () => {
    const m = hotSeatForMonth(2027, 1); // February 2027: Tuesdays are 2, 9, 16, 23
    expect(iso(m.session.startsAt)).toBe("2027-02-09T18:00:00.000Z");
    expect(iso(m.session.endsAt)).toBe("2027-02-09T19:30:00.000Z");
    expect(iso(m.applicationsCloseAt)).toBe("2027-02-02T18:00:00.000Z");
    expect(iso(m.selectionNoticeBy)).toBe("2027-02-04T18:00:00.000Z");
  });

  it("handles a month that starts on a Tuesday", () => {
    // June 2027 starts on a Tuesday.
    expect(nthWeekdayOfMonth(2027, 5, 2, 1)).toBe(1);
    const m = hotSeatForMonth(2027, 5);
    expect(iso(m.applicationsCloseAt)).toBe("2027-06-01T17:00:00.000Z");
    expect(iso(m.session.startsAt)).toBe("2027-06-08T17:00:00.000Z");
  });
});

describe("workshops publish the first and third Monday", () => {
  it("returns both dates in the business zone", () => {
    const [first, third] = workshopReleaseDates(2027, 2); // March 2027: Mondays 1, 8, 15, 22, 29
    expect(zonedParts(first!)).toMatchObject({ day: 1, weekday: 1, hour: 0 });
    expect(zonedParts(third!)).toMatchObject({ day: 15, weekday: 1, hour: 0 });
  });
});

describe("business days (D11)", () => {
  it("skips weekends", () => {
    // Thursday 2027-01-07 10:00 ET + 3 business days = Tuesday 2027-01-12 10:00 ET
    const due = addBusinessDays(new Date("2027-01-07T15:00:00Z"), 3);
    expect(iso(due)).toBe("2027-01-12T15:00:00.000Z");
  });
  it("skips published holidays", () => {
    const holidays = new Set(["2027-01-18"]); // example holiday supplied by admin config
    const due = addBusinessDays(new Date("2027-01-15T15:00:00Z"), 3, holidays); // Friday
    expect(iso(due)).toBe("2027-01-21T15:00:00.000Z");
  });
  it("keeps the wall clock time across a daylight saving change", () => {
    const due = addBusinessDays(new Date("2027-03-12T15:00:00Z"), 1); // Friday 10:00 EST
    expect(iso(due)).toBe("2027-03-15T14:00:00.000Z"); // Monday 10:00 EDT
  });
});

describe("feedback cycles (D11)", () => {
  const activation = new Date("2027-01-31T17:00:00Z"); // Jan 31, 12:00 ET

  it("is null before activation", () => {
    expect(feedbackCycleAt(activation, new Date("2027-01-31T16:59:59Z"))).toBeNull();
  });
  it("starts at activation and repeats on monthly anniversaries without drift", () => {
    const c0 = feedbackCycleAt(activation, activation)!;
    expect(c0.index).toBe(0);
    expect(iso(c0.endsAt)).toBe("2027-02-28T17:00:00.000Z");
    const c1 = feedbackCycleAt(activation, new Date("2027-03-01T00:00:00Z"))!;
    expect(c1.index).toBe(1);
    // March anniversary is the 31st again, computed from activation, not chained from Feb 28.
    expect(iso(c1.endsAt)).toBe("2027-03-31T16:00:00.000Z");
  });
  it("the boundary instant belongs to the next cycle", () => {
    expect(feedbackCycleAt(activation, new Date("2027-02-28T17:00:00Z"))!.index).toBe(1);
    expect(feedbackCycleAt(activation, new Date("2027-02-28T16:59:59Z"))!.index).toBe(0);
  });
  it("allows two per cycle with no rollover", () => {
    expect(feedbackRemaining(0)).toBe(2);
    expect(feedbackRemaining(2)).toBe(0);
    expect(feedbackRemaining(3)).toBe(0);
  });
});

describe("Elite rescheduling notice (D12)", () => {
  const start = new Date("2027-02-10T18:00:00Z");
  it("allows exactly 24 hours ahead and refuses later", () => {
    expect(canRescheduleWithoutForfeit(start, new Date("2027-02-09T18:00:00Z"))).toBe(true);
    expect(canRescheduleWithoutForfeit(start, new Date("2027-02-09T18:00:01Z"))).toBe(false);
  });
});

import { hotSeatTarget } from "./calendar";

describe("Hot Seat target month", () => {
  it("applies to this month before the first Tuesday close, otherwise next month", () => {
    expect(hotSeatTarget(new Date("2027-02-02T17:59:00Z")).targetMonth).toBe("2027-02-01");
    expect(hotSeatTarget(new Date("2027-02-02T18:00:00Z")).targetMonth).toBe("2027-03-01");
    expect(hotSeatTarget(new Date("2027-12-20T12:00:00Z")).targetMonth).toBe("2028-01-01");
  });
});

import { easternWallToUtc, utcToEasternWall } from "./calendar";

describe("Eastern wall time conversion for admin forms", () => {
  it("converts in winter and summer and round trips", () => {
    expect(easternWallToUtc("2027-01-06T13:00").toISOString()).toBe("2027-01-06T18:00:00.000Z");
    expect(easternWallToUtc("2027-07-07T13:00").toISOString()).toBe("2027-07-07T17:00:00.000Z");
    expect(utcToEasternWall(new Date("2027-07-07T17:00:00Z"))).toBe("2027-07-07T13:00");
  });
});
