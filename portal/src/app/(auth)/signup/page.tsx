import type { Metadata } from "next";
import { AuthNotConfigured } from "@/components/auth/not-configured";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="mt-6 text-4xl">Create your account</h1>
      <p className="mb-8 mt-2 text-ink-muted">Your training and audit unlock once your purchase is connected to this account.</p>
      <AuthNotConfigured />
      <SignUpForm />
    </>
  );
}
