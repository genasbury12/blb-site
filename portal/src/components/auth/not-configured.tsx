import { Alert } from "@/components/ui/alert";
import { isSupabaseConfigured } from "@/lib/env";

/** Honest state when an environment has no Supabase project yet. */
export function AuthNotConfigured() {
  if (isSupabaseConfigured()) return null;
  return (
    <Alert tone="warning" title="Sign in is not set up in this environment" className="mb-6">
      Accounts will work once the Supabase project is connected. Nothing you enter here is saved.
    </Alert>
  );
}
