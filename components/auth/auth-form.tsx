"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { MainButton } from "@/components/ui/main-button";
import { cn } from "@/lib/utils";

// The Supabase client (~66 KB) loads only when someone actually signs up or logs in,
// not with the landing page.
const loadSb = () => import("@/lib/supabase/client").then((m) => m.supabaseBrowser());

export const GOOGLE_ON = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1";

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function friendly(msg: string, mode: "signup" | "login") {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return { field: "email", text: "This email already has an account. Log in?" };
  if (m.includes("invalid login") || m.includes("invalid credentials")) return { field: "password", text: "Wrong email or password. Try again or reset your password." };
  if (m.includes("password") && m.includes("6")) return { field: "password", text: "Use at least 6 characters." };
  if (m.includes("email") && (m.includes("invalid") || m.includes("valid"))) return { field: "email", text: "That email doesn't look right." };
  if (m.includes("rate")) return { field: "form", text: "Too many tries. Wait a minute and try again." };
  return { field: "form", text: mode === "signup" ? "We couldn't create your account. Try again." : "We couldn't log you in. Try again." };
}

export function AuthForm({
  mode, headline, sub, cta, onDone, next = "/dashboard", switchHref,
}: {
  mode: "signup" | "login"; headline: string; sub?: string; cta?: string; onDone: (isNew: boolean) => void | Promise<void>; next?: string; switchHref?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ field: string; text: string } | null>(null);
  const [m, setM] = useState(mode);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr({ field: "email", text: "That email doesn't look right." });
    if (password.length < 6) return setErr({ field: "password", text: "Use at least 6 characters." });
    setBusy(true);
    const sb = await loadSb();
    try {
      if (m === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0) throw new Error("already registered");
        if (!data.session) {
          const r = await sb.auth.signInWithPassword({ email, password });
          if (r.error) throw r.error;
        }
        await onDone(true);
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await onDone(false);
      }
    } catch (e) {
      setErr(friendly((e as Error).message ?? "", m));
      setBusy(false);
    }
  }

  async function google() {
    const sb = await loadSb();
    await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
  }

  return (
    <div className="mx-auto w-full max-w-[400px]">
      <h2 className="text-center text-[28px] font-bold leading-[1.08] tracking-[-0.03em] text-white">{m === "signup" ? headline : "Welcome back"}</h2>
      {sub && m === "signup" && <p className="mt-2 text-center text-[15px] text-mute">{sub}</p>}
      <div className="mt-7 space-y-3">
        {GOOGLE_ON && (
          <>
            <button type="button" onClick={google} className="flex h-[54px] w-full items-center justify-center gap-3 rounded-full bg-white text-[16px] font-semibold text-[#1f1f1f] transition hover:bg-zinc-100 active:scale-[.97]">
              <GoogleG /> Continue with Google
            </button>
            <div className="flex items-center gap-3 py-1 text-[12px] text-mute-2"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
          </>
        )}
        <form onSubmit={submit} className="space-y-3" noValidate>
          <div>
            <label className="sr-only" htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" autoComplete="email" inputMode="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={cn("h-[54px] w-full rounded-2xl border bg-white/[.04] px-4 text-[16px] text-white placeholder:text-mute-2 outline-none transition focus:border-lime/70 focus:bg-white/[.06]", err?.field === "email" ? "border-hot" : "border-line-2")} />
            {err?.field === "email" && (
              <p className="mt-1.5 text-[13px] text-hot">
                {err.text.endsWith("Log in?") ? <>This email already has an account. <button type="button" className="underline" onClick={() => { setM("login"); setErr(null); }}>Log in?</button></> : err.text}
              </p>
            )}
          </div>
          <div>
            <label className="sr-only" htmlFor="auth-pass">Password</label>
            <div className="relative">
              <input id="auth-pass" type={show ? "text" : "password"} autoComplete={m === "signup" ? "new-password" : "current-password"} placeholder={m === "signup" ? "Create a password" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)}
                className={cn("h-[54px] w-full rounded-2xl border bg-white/[.04] px-4 pr-12 text-[16px] text-white placeholder:text-mute-2 outline-none transition focus:border-lime/70 focus:bg-white/[.06]", err?.field === "password" ? "border-hot" : "border-line-2")} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-mute hover:text-white">
                {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {err?.field === "password" && <p className="mt-1.5 text-[13px] text-hot">{err.text}</p>}
          </div>
          {err?.field === "form" && <p className="text-[13px] text-hot">{err.text}</p>}
          <MainButton type="submit" size="md" className="w-full" loading={busy} glow={false}>
            {m === "signup" ? cta ?? "Create my account" : "Log in"}
          </MainButton>
        </form>
        <div className="flex items-center justify-between pt-1 text-[14px] text-mute">
          {m === "signup" ? (
            <span>Already have an account? {switchHref ? <Link href={switchHref} className="font-medium text-white underline-offset-4 hover:underline">Log in</Link> : <button type="button" onClick={() => { setM("login"); setErr(null); }} className="font-medium text-white underline-offset-4 hover:underline">Log in</button>}</span>
          ) : (
            <>
              <button type="button" onClick={() => { setM("signup"); setErr(null); }} className="font-medium text-white underline-offset-4 hover:underline">Create an account</button>
              <Link href="/forgot" className="underline-offset-4 hover:text-white hover:underline">Forgot password?</Link>
            </>
          )}
        </div>
        <p className="pt-2 text-center text-[12px] text-mute-2">
          By continuing you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy</Link>.
        </p>
      </div>
    </div>
  );
}
