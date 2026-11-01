"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { updatePasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { resetSchema, type ActionResult } from "@/lib/validation/auth";
import { FormMessage, TextField } from "./form-bits";

type Values = z.input<typeof resetSchema>;

export function ResetForm() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirm: "" } });
  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const r = await updatePasswordAction(values);
      if (r && !r.ok) setResult(r);
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div aria-live="polite">
        <FormMessage result={result} />
      </div>
      <TextField
        id="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 10 characters with an uppercase letter, a lowercase letter, and a number."
        error={formState.errors.password?.message}
        {...register("password")}
      />
      <TextField id="confirm" label="Confirm new password" type="password" autoComplete="new-password" error={formState.errors.confirm?.message} {...register("confirm")} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving" : "Save new password"}
      </Button>
    </form>
  );
}
