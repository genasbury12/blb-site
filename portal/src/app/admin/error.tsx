"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function MemberError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-4">
      <Alert tone="danger" title="Something went wrong loading this page">
        Your saved work is safe. Try again, and if it keeps happening, contact support.
      </Alert>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
