/**
 * 10_DATA_RIGHTS Slice C: the retention rules, in one place. The daily job, the admin Data page and the privacy text
 * all read these numbers. Owner defaults (2026-11-04): unchanged from the brief.
 */
export const RETENTION = {
  /** A member's deletion request is carried out at most this many days after it was made. */
  deletionWindowDays: 30,
  /** After access ends, data and the download stay this many months, then the account is deleted. */
  lapsedRetentionMonths: 12,
  /** Accounts that never bought anything are deleted this many months after their last sign in. */
  inactiveAccountMonths: 12,
  /** Anonymized purchase records of deleted members are kept this many years (tax), then removed. */
  purchaseRecordYears: 7,
  /** Reminder emails before a retention deletion, in days. */
  reminderDays: [30, 7] as const,
} as const;

export type NoticeKind = "30_days" | "7_days";

/** access_ended: a member whose program access ended. inactive: an account that never bought anything. */
export type RetentionBasis = "access_ended" | "inactive";

export type RetentionFact = {
  userId: string;
  basis: RetentionBasis;
  /** When access ended, or for inactive accounts the last sign in (sign up if never). */
  since: Date;
  isStaff: boolean;
  hasOpenRequest: boolean;
  /** Owes a balance (plan payments left, or a membership payment past due): never deleted automatically. */
  held: boolean;
  /** Reminders already sent for this lapse. */
  notices: string[];
};

export type RetentionAction =
  | { userId: string; action: "delete"; basis: RetentionBasis; since: Date; held: boolean }
  | { userId: string; action: "remind"; kind: NoticeKind; basis: RetentionBasis; deleteOn: Date; since: Date };

const DAY = 864e5;

/** Calendar months in UTC; the day is clamped to the end of a shorter month (Jan 31 + 1 month = Feb 28 or 29). */
export function addMonthsUTC(d: Date, months: number): Date {
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return target;
}

/** When an account is deleted under retention. */
export function retentionDeletionDate(since: Date, basis: RetentionBasis = "access_ended"): Date {
  return addMonthsUTC(since, basis === "inactive" ? RETENTION.inactiveAccountMonths : RETENTION.lapsedRetentionMonths);
}

/**
 * What the daily job does today for each lapsed member or inactive account. Staff and members with their own open
 * deletion request are left alone. A missed day never skips a step: an overdue reminder is still sent, but only the
 * latest one (never the 30 day reminder when the 7 day one is already due). Members who owe a balance get no
 * reminders (they will not be deleted on that date); when the date comes a request is opened for an admin.
 */
export function planRetention(facts: RetentionFact[], now: Date): RetentionAction[] {
  const out: RetentionAction[] = [];
  for (const f of facts) {
    if (f.isStaff || f.hasOpenRequest) continue;
    const deleteOn = retentionDeletionDate(f.since, f.basis);
    if (now.getTime() >= deleteOn.getTime()) {
      out.push({ userId: f.userId, action: "delete", basis: f.basis, since: f.since, held: f.held });
      continue;
    }
    if (f.held) continue;
    const daysLeft = (deleteOn.getTime() - now.getTime()) / DAY;
    const base = { userId: f.userId, action: "remind" as const, basis: f.basis, deleteOn, since: f.since };
    if (daysLeft <= 7) {
      if (!f.notices.includes("7_days")) out.push({ ...base, kind: "7_days" });
    } else if (daysLeft <= 30) {
      if (!f.notices.includes("30_days") && !f.notices.includes("7_days")) out.push({ ...base, kind: "30_days" });
    }
  }
  return out;
}
