import type { Metadata } from "next";
import { AuthNotConfigured } from "@/components/auth/not-configured";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mt-6 text-4xl">Choose a new password</h1>
      <p className="mb-8 mt-2 text-ink-muted">You opened this page from a reset link. Pick a new password to finish.</p>
      <AuthNotConfigured />
      <ResetForm />
    </>
  );
}
