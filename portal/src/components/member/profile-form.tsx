"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/app/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [value, setValue] = useState(displayName);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateProfile({ displayName: value });
          setStatus(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.error });
        });
      }}
    >
      <div>
        <Label htmlFor="displayName">First name</Label>
        <Input id="displayName" value={value} maxLength={80} onChange={(e) => setValue(e.target.value)} autoComplete="given-name" />
      </div>
      <div aria-live="polite">{status ? <Alert tone={status.ok ? "success" : "danger"}>{status.text}</Alert> : null}</div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </Button>
    </form>
  );
}
