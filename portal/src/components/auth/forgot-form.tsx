"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { forgotPasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { forgotSchema, type ActionResult } from "@/lib/validation/auth";
import { FormMessage, TextField } from "./form-bits";

export function ForgotForm() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState } = useForm<z.input<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });
  const onSubmit = handleSubmit((values) => startTransition(async () => setResult(await forgotPasswordAction(values))));
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div aria-live="polite">
        <FormMessage result={result} />
      </div>
      <TextField id="email" label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending" : "Send reset link"}
      </Button>
    </form>
  );
}
