"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-page";
import { MainButton } from "@/components/ui/main-button";

export default function Page() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return setErr("Use at least 6 characters.");
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr("This reset link expired. Ask for a new one.");
    router.replace("/dashboard");
  }
  return (
    <AuthShell>
      <h1 className="text-center text-[28px] font-bold tracking-[-0.03em] text-white">Choose a new password</h1>
      <form onSubmit={go} className="mt-6 space-y-3">
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" aria-label="New password" autoComplete="new-password" className="h-[54px] w-full rounded-2xl border border-line-2 bg-white/[.04] px-4 text-[16px] text-white placeholder:text-mute-2 outline-none focus:border-lime/70" />
        {err && <p className="text-[13px] text-hot">{err}</p>}
        <MainButton type="submit" size="md" className="w-full" glow={false} loading={busy}>Save my password</MainButton>
      </form>
    </AuthShell>
  );
}
