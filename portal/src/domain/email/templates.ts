/** Transactional email templates (D16). Plain text, no tracking. Copy is provisional (COPY_REVIEW.md). */
export type Email = { subject: string; text: string };

const sign = "\n\nThe BOSS Business System";

export function feedbackResponded(p: { name: string | null; title: string; url: string }): Email {
  return {
    subject: "Your feedback is ready",
    text: `Hi ${p.name ?? "there"},\n\nYour coach responded to "${p.title}". Read it here:\n${p.url}${sign}`,
  };
}

export function hotSeatDecision(p: { name: string | null; selected: boolean; month: string; url: string }): Email {
  return p.selected
    ? { subject: `You are in the ${p.month} Hot Seat`, text: `Hi ${p.name ?? "there"},\n\nYour application was selected for the ${p.month} Hot Seat. Session details are in the Coaching Hub:\n${p.url}${sign}` }
    : { subject: `About your ${p.month} Hot Seat application`, text: `Hi ${p.name ?? "there"},\n\nYour application was not selected this month. You can see the details, and edit or withdraw it, in the Coaching Hub:\n${p.url}${sign}` };
}

export function eliteDecision(p: { name: string; accepted: boolean; url: string }): Email {
  return p.accepted
    ? { subject: "Your Elite application was accepted", text: `Hi ${p.name},\n\nWe would love to work with you. Sign in to complete enrollment:\n${p.url}${sign}` }
    : { subject: "About your Elite application", text: `Hi ${p.name},\n\nThank you for applying. Elite is not the right fit right now. Accelerator may be a better next step:\n${p.url}${sign}` };
}
