import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms (draft)" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms of use</h1>
      <p>Final terms are being prepared with legal counsel. Until they are approved, these points describe how the program works.</p>
      <ul>
        <li>Training, the audit and the Implementation Library are open for 12 months from your first payment. An active graduate coaching membership keeps them open while it lasts.</li>
        <li>Coaching, community, workshops, Hot Seat and feedback (where included) last six months from your first payment.</li>
        <li>Results depend on your market, effort, skills and circumstances. No income, traffic or sales results are promised.</li>
        <li>AI assistants are external tools you use in your own accounts. Review and test anything AI produces before you rely on it.</li>
      </ul>
    </>
  );
}
