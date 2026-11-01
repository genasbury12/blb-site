import type { Metadata } from "next";
import { AuthNotConfigured } from "@/components/auth/not-configured";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mt-6 text-4xl">Reset your password</h1>
      <p className="mb-8 mt-2 text-ink-muted">Enter your email and we will send you a link to choose a new password.</p>
      <AuthNotConfigured />
      <ForgotForm />
    </>
  );
}
