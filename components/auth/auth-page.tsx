"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/ui/logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-16">
      <div className="dot-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(200,255,61,.12),transparent)] blur-2xl" />
      <div className="relative w-full max-w-[440px]">
        <Link href="/" className="mb-8 flex justify-center"><Logo /></Link>
        <div className="rounded-[26px] border border-line bg-ink-2/90 px-6 py-9 shadow-[0_30px_100px_-30px_rgba(0,0,0,.8)] backdrop-blur md:px-9">{children}</div>
      </div>
    </div>
  );
}

export function AuthPage({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  return (
    <AuthShell>
      <AuthForm
        mode={mode}
        headline="Sign up so Vidflow can find your clips"
        sub="Free. No card. Your first clips in about a minute."
        cta="Create my account"
        switchHref={mode === "signup" ? "/login" : undefined}
        onDone={async (isNew) => {
          const r = await fetch("/api/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isNew }) });
          const j = await r.json().catch(() => ({}));
          router.replace(j.lastProject ? `/clips/${j.lastProject}` : "/dashboard");
          router.refresh();
        }}
      />
    </AuthShell>
  );
}
