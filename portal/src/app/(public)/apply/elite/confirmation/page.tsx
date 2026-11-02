import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Application received" };

export default function ConfirmationPage() {
  return (
    <div>
      <PageHeader eyebrow="BOSS Elite" title="Your application is in" lede="Thank you. We read every application personally. If it looks like a fit, we will reach out to schedule a discovery call." />
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/signup">Create your account</ButtonLink>
        <ButtonLink href="/" variant="secondary">Back to the portal</ButtonLink>
      </div>
    </div>
  );
}
