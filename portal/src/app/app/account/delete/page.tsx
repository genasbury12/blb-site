import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requestDeletion } from "@/app/app/account/data-actions";
import { ActionForm } from "@/components/admin/action-form";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Delete my account" };

/** 10_DATA_RIGHTS Slice B: what deletion removes, what is kept and why, then confirm by typing DELETE. */
export default async function DeleteAccountPage() {
  const { supabase, user } = await requireSession("/app/account/delete");
  const { data: open } = await supabase.from("deletion_requests").select("id").eq("user_id", user.id).in("status", ["pending", "processing"]).maybeSingle();
  if (open) redirect("/app/account#your-data");
  const { data: owed } = await supabase.rpc("deletion_balances", { p_users: [user.id] });
  const owes = (owed ?? []).length > 0;

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader eyebrow="My Account" title="Delete my account and data" lede="Please read this first. Deletion is permanent and cannot be undone." />

      <Card>
        <CardTitle className="text-xl">What will be deleted</CardTitle>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
          <li>Your profile and your sign in</li>
          <li>Your business audit, results and roadmap</li>
          <li>Your lesson progress, milestones and every worksheet answer</li>
          <li>Your coaching questions, Hot Seat applications and feedback submissions</li>
          <li>The words of your community posts and replies. They stay in place so other members&apos; conversations still make sense, but each one says it was removed and shows &quot;Deleted member&quot; instead of your name.</li>
          <li>Your Elite workspace, check ins and requests, if you have one</li>
          <li>Every file you uploaded</li>
        </ul>
      </Card>

      <Card>
        <CardTitle className="text-xl">What we keep, and why</CardTitle>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
          <li>The record of your purchases (product, amount, dates and payment status), which we need for tax and refunds. Your name and email are removed from it.</li>
          <li>Our activity log of changes made in the portal. Your name, email and account are replaced in it by an anonymous code.</li>
          <li>We also delete your customer record at Stripe, our payment processor. Stripe keeps its own records of past payments.</li>
        </ul>
      </Card>

      <Card>
        <CardTitle className="text-xl">What happens next</CardTitle>
        {owes ? (
          <p className="mt-2 text-sm font-semibold">
            You still have payments due on your plan. Our team will review your request and contact you before your account is deleted.
          </p>
        ) : null}
        <p className="mt-2 text-sm">
          {owes ? "You will get an email when it is done." : "Your account will be deleted within 30 days, and you will get an email when it is done."} Until then you can still sign in, download your data and cancel the request from My Account.
          If you want a copy of your answers and PDFs, <Link className="text-plum underline" href="/app/account#your-data">download your data</Link> first.
        </p>
        <div className="mt-5">
          <ActionForm action={requestDeletion} submitLabel="Request deletion" pendingLabel="Sending request" variant="primary">
            <label htmlFor="confirm" className="block text-sm font-semibold">
              Type DELETE to confirm
            </label>
            <input id="confirm" name="confirm" autoComplete="off" autoCapitalize="characters" spellCheck={false} className="min-h-11 w-full max-w-xs rounded-xl border border-mauve bg-white px-3" />
          </ActionForm>
        </div>
      </Card>

      <Link href="/app/account" className="text-sm font-semibold text-plum underline-offset-4 hover:underline">
        Keep my account
      </Link>
    </div>
  );
}
