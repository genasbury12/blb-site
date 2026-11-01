"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { signInAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { signInSchema, type ActionResult } from "@/lib/validation/auth";
import { FormMessage, TextField } from "./form-bits";

type Values = z.input<typeof signInSchema>;

export function SignInForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? undefined;
  const linkError = params.get("error") === "link";
  const [result, setResult] = useState<ActionResult | null>(
    linkError ? { ok: false, error: "That link is invalid or has expired. Request a new one." } : null,
  );
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState, setError } = useForm<Values>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", next },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const r = await signInAction({ ...values, next });
      if (r && !r.ok) {
        setResult(r);
        for (const [k, msg] of Object.entries(r.fieldErrors ?? {})) setError(k as keyof Values, { message: msg });
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" aria-describedby="signin-status">
      <div id="signin-status" aria-live="polite">
        <FormMessage result={result} />
      </div>
      <TextField id="email" label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={formState.errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link className="text-plum underline underline-offset-4" href="/forgot-password">
          Forgot your password?
        </Link>
        <Link className="text-plum underline underline-offset-4" href="/signup">
          Create an account
        </Link>
      </div>
    </form>
  );
}
