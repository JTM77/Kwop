"use client";
import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-page";
import { MainButton } from "@/components/ui/main-button";

export default function Page() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("That email doesn't look right.");
    setBusy(true);
    await supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset` }).catch(() => null);
    setBusy(false);
    setSent(true);
  }
  return (
    <AuthShell>
      <h1 className="text-center text-[28px] font-bold tracking-[-0.03em] text-white">Reset your password</h1>
      {sent ? (
        <p className="mt-4 text-center text-[15px] text-white/80">If {email} has an account, a reset link is on its way. Check your inbox.</p>
      ) : (
        <form onSubmit={go} className="mt-6 space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" className="h-[54px] w-full rounded-2xl border border-line-2 bg-white/[.04] px-4 text-[16px] text-white placeholder:text-mute-2 outline-none focus:border-lime/70" />
          {err && <p className="text-[13px] text-hot">{err}</p>}
          <MainButton type="submit" size="md" className="w-full" glow={false} loading={busy}>Send me a reset link</MainButton>
        </form>
      )}
      <p className="mt-5 text-center text-[14px] text-mute"><Link href="/login" className="text-white hover:underline">Back to log in</Link></p>
    </AuthShell>
  );
}
