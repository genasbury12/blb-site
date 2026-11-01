import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import type { BillingNotice } from "@/lib/server/session";

const fmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

export function formatDate(d: string | Date) {
  return fmt.format(typeof d === "string" ? new Date(d) : d);
}

/** D07: billing notice during grace; suspension notice after. Work is never erased. */
export function BillingNotices({ notices }: { notices: BillingNotice[] }) {
  if (!notices.length) return null;
  return (
    <div className="space-y-3">
      {notices.map((n, i) =>
        n.suspended ? (
          <Alert key={i} tone="danger" title="Your access is paused until a payment goes through">
            A scheduled payment did not go through, and the grace period ended on {formatDate(n.graceEndsAt)}. Your saved work is kept.
            Update your payment method from <Link className="underline" href="/app/account">My Account</Link> to restore access.
          </Alert>
        ) : (
          <Alert key={i} tone="warning" title="A payment did not go through">
            Your access continues until {formatDate(n.graceEndsAt)}. Update your payment method from{" "}
            <Link className="underline" href="/app/account">My Account</Link> before then to keep everything open.
          </Alert>
        ),
      )}
    </div>
  );
}

/** Shown when a page needs a feature the member does not currently hold. */
export function NoAccess({ what }: { what: string }) {
  return (
    <Alert tone="info" title={`${what} is not part of your current access`}>
      If you expected to see this, your access may have ended or a payment may be pending. Your account and saved work are still here.
      Check your access dates in <Link className="underline" href="/app/account">My Account</Link>.
    </Alert>
  );
}
