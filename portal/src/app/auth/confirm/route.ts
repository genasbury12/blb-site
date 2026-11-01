import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Email link handler for confirmation and password recovery. Configure Supabase email templates to
 * link to {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const failure = new URL("/login?error=link", url.origin);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(failure);

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return NextResponse.redirect(failure);
    if (type === "recovery") return NextResponse.redirect(new URL("/reset-password", url.origin));
    return NextResponse.redirect(new URL(safeNextPath(url.searchParams.get("next")), url.origin));
  }
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(failure);
    return NextResponse.redirect(new URL(safeNextPath(url.searchParams.get("next")), url.origin));
  }
  return NextResponse.redirect(failure);
}
