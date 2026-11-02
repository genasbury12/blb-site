import type { Metadata } from "next";
import { submitEliteApplication } from "@/app/app/elite/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea, TextInput } from "@/components/admin/fields";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { requireFlag } from "@/lib/server/flags";

export const metadata: Metadata = { title: "Apply for BOSS Elite" };

export default function ApplyElitePage() {
  requireFlag("elite");
  return (
    <div>
      <PageHeader
        eyebrow="BOSS Elite"
        title="Apply for Elite"
        lede="Elite is limited to five clients at a time. It starts with this application and a conversation. If we are a good fit, you will get an invitation to enroll."
      />
      <Card>
        <ActionForm action={submitEliteApplication} submitLabel="Send my application" pendingLabel="Sending">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" htmlFor="name"><TextInput id="name" name="name" required autoComplete="name" /></Field>
            <Field label="Email" hint="Use the email you will sign in with." htmlFor="email"><TextInput id="email" name="email" type="email" required autoComplete="email" /></Field>
          </div>
          <Field label="Website (optional)" htmlFor="business_url"><TextInput id="business_url" name="business_url" type="url" placeholder="https://" /></Field>
          <Field label="Where is your business today?" htmlFor="business_stage"><TextArea id="business_stage" name="business_stage" required maxLength={500} className="min-h-20" /></Field>
          <Field label="What do you want in place six months from now?" htmlFor="goals"><TextArea id="goals" name="goals" required maxLength={3000} /></Field>
          <Field label="What is your biggest challenge right now?" htmlFor="biggest_challenge"><TextArea id="biggest_challenge" name="biggest_challenge" required maxLength={3000} /></Field>
          <Field label="Hours per week you can give your business (optional)" htmlFor="hours_per_week"><TextInput id="hours_per_week" name="hours_per_week" type="number" min={0} max={80} className="w-32" /></Field>
          <div aria-hidden="true" className="hidden">
            <label htmlFor="website">Leave this empty</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          <p className="text-sm text-ink-muted">We only use this to review your application. See the <a className="underline" href="/privacy">privacy draft</a>.</p>
        </ActionForm>
      </Card>
    </div>
  );
}
