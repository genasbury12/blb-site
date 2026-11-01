"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { signUpAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { signUpSchema, type ActionResult } from "@/lib/validation/auth";
import { FormMessage, TextField } from "./form-bits";

type Values = z.input<typeof signUpSchema>;

export function SignUpForm() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState, setError, reset } = useForm<Values>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const r = await signUpAction(values);
      setResult(r);
      if (r.ok) reset();
      else for (const [k, msg] of Object.entries(r.fieldErrors ?? {})) setError(k as keyof Values, { message: msg });
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div aria-live="polite">
        <FormMessage result={result} />
      </div>
      <TextField id="displayName" label="First name" autoComplete="given-name" error={formState.errors.displayName?.message} {...register("displayName")} />
      <TextField id="email" label="Email" type="email" autoComplete="email" hint="Use the email you purchased with so your access connects automatically." error={formState.errors.email?.message} {...register("email")} />
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 10 characters with an uppercase letter, a lowercase letter, and a number."
        error={formState.errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating your account" : "Create account"}
      </Button>
      <p className="text-sm">
        Already have an account?{" "}
        <Link className="text-plum underline underline-offset-4" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
