import type { Metadata } from "next";

export const metadata: Metadata = { title: "Refund policy (draft)" };

export default function RefundPolicyPage() {
  const support = process.env.SUPPORT_CONTACT_EMAIL;
  return (
    <>
      <h1>Refund policy</h1>
      <h2>BOSS Blueprint and BOSS Accelerator</h2>
      <p>A 14 day action based guarantee applies. To request a refund within 14 days of enrolling, you complete onboarding, complete the business audit, and attempt the first recommended assignment, and share reasonable evidence of that work.</p>
      <h2>BOSS Elite</h2>
      <p>Elite enrollments are final after enrollment, subject to your legal rights and to remedies if promised services are not delivered.</p>
      <h2>How requests are handled</h2>
      <ul>
        <li>Requests are reviewed by a person within three business days, with an approval, a denial, or a request for more information.</li>
        <li>When a refund is approved and processed, access tied to that purchase ends. You can ask for copies of your own records.</li>
        <li>{support ? <>Email <a className="text-plum underline" href={`mailto:${support}`}>{support}</a> if you cannot sign in.</> : "A support email will be listed here before launch."}</li>
      </ul>
      <h2>Payment plans and memberships</h2>
      <ul>
        <li>Six payment plans are a commitment to six monthly payments, not a cancel anytime subscription. Billing stops after the sixth payment.</li>
        <li>If a scheduled payment fails, access continues for seven calendar days, then pauses until the payment goes through. Your work is never deleted.</li>
        <li>Graduate coaching and Elite board retention memberships can be canceled anytime and continue through the end of the paid period.</li>
      </ul>
    </>
  );
}
