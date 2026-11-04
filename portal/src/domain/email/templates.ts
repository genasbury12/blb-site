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

/** Data rights Slice B: to the owner when a member asks for deletion. Name only; no other member data. */
export function deletionRequestedOwner(p: { name: string | null; dueOn: string; url: string }): Email {
  return {
    subject: "A member asked to delete their account",
    text: `${p.name ?? "A member"} asked for their account and data to be deleted. It will be deleted automatically on ${p.dueOn} unless you delete it sooner or they cancel.\n\nReview it here:\n${p.url}${sign}`,
  };
}

/** Data rights Slice B: to the member once deletion is done. Sent to the address on file, which is then forgotten. */
export function deletionCompleted(p: { name: string | null }): Email {
  return {
    subject: "Your account has been deleted",
    text: `Hi ${p.name ?? "there"},\n\nYour BOSS Business System account and your data have been deleted, as you asked. We kept only two things: the record of your purchases, which we need for tax and refunds, and our activity log. In both, your name and email are replaced by an anonymous code. You do not need to do anything else.${sign}`,
  };
}
