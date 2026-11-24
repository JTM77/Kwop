import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Google sign-in and password-reset links land here.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(`/auth/done?next=${encodeURIComponent(safe)}`, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
}
