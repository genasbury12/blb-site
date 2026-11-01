import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthNotConfigured } from "@/components/auth/not-configured";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mt-6 text-4xl">Welcome back</h1>
      <p className="mb-8 mt-2 text-ink-muted">Sign in to pick up where you left off.</p>
      <AuthNotConfigured />
      <Suspense>
        <SignInForm />
      </Suspense>
    </>
  );
}
