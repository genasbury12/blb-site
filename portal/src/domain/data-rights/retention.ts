/**
 * 10_DATA_RIGHTS Slice C: the retention rules, in one place. The daily job, the admin Data page and the privacy text
 * all read these numbers. Owner defaults (2026-11-04): unchanged from the brief.
 */
export const RETENTION = {
  /** A member's deletion request is carried out at most this many days after it was made. */
  deletionWindowDays: 30,
  /** After access ends, data and the download stay this many months, then the account is deleted. */
  lapsedRetentionMonths: 12,
  /** Anonymized purchase records of deleted members are kept this many years (tax), then removed. */
  purchaseRecordYears: 7,
  /** Reminder emails before a retention deletion, in days. */
  reminderDays: [30, 7] as const,
} as const;

export type NoticeKind = "30_days" | "7_days";

export type RetentionFact = {
  userId: string;
  accessEndedAt: Date;
  isStaff: boolean;
  hasOpenRequest: boolean;
  /** Reminders already sent for this lapse. */
  notices: string[];
};

export type RetentionAction =
  | { userId: string; action: "delete"; accessEndedAt: Date }
  | { userId: string; action: "remind"; kind: NoticeKind; deleteOn: Date; accessEndedAt: Date };

const DAY = 864e5;

/** Calendar months in UTC; the day is clamped to the end of a shorter month (Jan 31 + 1 month = Feb 28 or 29). */
export function addMonthsUTC(d: Date, months: number): Date {
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return target;
}

/** When a lapsed member's account is deleted. */
export function retentionDeletionDate(accessEndedAt: Date): Date {
  return addMonthsUTC(accessEndedAt, RETENTION.lapsedRetentionMonths);
}

/**
 * What the daily job does today for each lapsed member. Staff and members with their own open deletion request are
 * left alone. A missed day never skips a step: an overdue reminder is still sent, but only the latest one (a member
 * is never sent the 30 day reminder when the 7 day one is already due).
 */
export function planRetention(facts: RetentionFact[], now: Date): RetentionAction[] {
  const out: RetentionAction[] = [];
  for (const f of facts) {
    if (f.isStaff || f.hasOpenRequest) continue;
    const deleteOn = retentionDeletionDate(f.accessEndedAt);
    if (now.getTime() >= deleteOn.getTime()) {
      out.push({ userId: f.userId, action: "delete", accessEndedAt: f.accessEndedAt });
      continue;
    }
    const daysLeft = (deleteOn.getTime() - now.getTime()) / DAY;
    if (daysLeft <= 7) {
      if (!f.notices.includes("7_days")) out.push({ userId: f.userId, action: "remind", kind: "7_days", deleteOn, accessEndedAt: f.accessEndedAt });
    } else if (daysLeft <= 30) {
      if (!f.notices.includes("30_days") && !f.notices.includes("7_days")) out.push({ userId: f.userId, action: "remind", kind: "30_days", deleteOn, accessEndedAt: f.accessEndedAt });
    }
  }
  return out;
}
