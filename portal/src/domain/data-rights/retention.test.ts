import { describe, expect, it } from "vitest";
import { addMonthsUTC, planRetention, RETENTION, retentionDeletionDate, type RetentionFact } from "./retention";

const d = (s: string) => new Date(s);
const fact = (over: Partial<RetentionFact> = {}): RetentionFact => ({ userId: "u1", accessEndedAt: d("2026-01-15T12:00:00Z"), isStaff: false, hasOpenRequest: false, notices: [], ...over });

describe("retention numbers", () => {
  it("are the owner's defaults", () => {
    expect(RETENTION).toEqual({ deletionWindowDays: 30, lapsedRetentionMonths: 12, purchaseRecordYears: 7, reminderDays: [30, 7] });
  });
});

describe("month arithmetic", () => {
  it("adds calendar months and clamps to shorter months", () => {
    expect(addMonthsUTC(d("2026-01-15T12:00:00Z"), 12).toISOString()).toBe("2027-01-15T12:00:00.000Z");
    expect(addMonthsUTC(d("2026-01-31T00:00:00Z"), 1).toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(addMonthsUTC(d("2028-02-29T09:30:00Z"), 12).toISOString()).toBe("2029-02-28T09:30:00.000Z");
    expect(retentionDeletionDate(d("2026-11-04T23:00:00Z")).toISOString()).toBe("2027-11-04T23:00:00.000Z");
  });
});

describe("daily retention plan", () => {
  const ended = d("2026-01-15T12:00:00Z"); // deletion on 2027-01-15T12:00Z

  it("does nothing before the 30 day reminder window", () => {
    expect(planRetention([fact()], d("2026-12-16T11:59:00Z"))).toEqual([]);
  });

  it("sends the 30 day reminder once, then the 7 day one once", () => {
    const at30 = d("2026-12-16T12:00:00Z");
    expect(planRetention([fact()], at30)).toEqual([{ userId: "u1", action: "remind", kind: "30_days", deleteOn: d("2027-01-15T12:00:00Z"), accessEndedAt: ended }]);
    expect(planRetention([fact({ notices: ["30_days"] })], d("2026-12-20T12:00:00Z"))).toEqual([]);
    const at7 = d("2027-01-08T12:00:00Z");
    expect(planRetention([fact({ notices: ["30_days"] })], at7)).toEqual([{ userId: "u1", action: "remind", kind: "7_days", deleteOn: d("2027-01-15T12:00:00Z"), accessEndedAt: ended }]);
    expect(planRetention([fact({ notices: ["30_days", "7_days"] })], d("2027-01-10T12:00:00Z"))).toEqual([]);
  });

  it("after a missed run sends only the latest reminder", () => {
    expect(planRetention([fact()], d("2027-01-10T12:00:00Z"))).toMatchObject([{ action: "remind", kind: "7_days" }]);
  });

  it("deletes exactly 12 months after access ended, not a moment before", () => {
    expect(planRetention([fact({ notices: ["30_days", "7_days"] })], d("2027-01-15T11:59:59Z"))).toEqual([]);
    expect(planRetention([fact()], d("2027-01-15T12:00:00Z"))).toEqual([{ userId: "u1", action: "delete", accessEndedAt: ended }]);
  });

  it("never touches staff or members who already asked for deletion", () => {
    const late = d("2028-01-01T00:00:00Z");
    expect(planRetention([fact({ isStaff: true }), fact({ userId: "u2", hasOpenRequest: true })], late)).toEqual([]);
  });
});
