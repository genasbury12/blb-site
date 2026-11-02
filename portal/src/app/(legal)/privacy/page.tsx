import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy (draft)" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy</h1>
      <p>The final privacy policy is being prepared with legal counsel. These are the practices the portal is built to follow.</p>
      <ul>
        <li>We collect the minimum needed to run the program: your name, email, purchases, progress, audit answers and the work you choose to share.</li>
        <li>Card details are handled by Stripe and never stored by this portal.</li>
        <li>Your audit answers, feedback, files and Elite workspace are private to you and the staff who support you.</li>
        <li>Files are stored privately and shared only through links that expire after five minutes.</li>
        <li>Analytics never include your audit answers, feedback or private content.</li>
        <li>You can ask for your account to be deleted. Requests are processed within 30 days unless law or a contract requires longer. Invoices are kept as the law requires.</li>
      </ul>
    </>
  );
}
