"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, Film, Settings, UserRound, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useUnlock } from "@/components/paywall/unlock-provider";
import { shortName } from "@/lib/plans";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/clips", label: "Clips", icon: Film },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/account", label: "Account", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { me, unlock } = useUnlock();
  const active = (h: string) => path === h || path.startsWith(h + "/");
  return (
    <div className="min-h-dvh md:pl-[248px]">
      {/* sidebar (computer) */}
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-line bg-ink-2 px-4 py-5 md:flex">
        <Link href="/dashboard" className="px-2"><Logo /></Link>
        <nav className="mt-8 space-y-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition", active(n.href) ? "bg-white/[.07] text-white" : "text-white/60 hover:bg-white/[.04] hover:text-white")}>
              <n.icon className={cn("h-[18px] w-[18px]", active(n.href) && "text-lime")} />{n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-line bg-white/[.03] p-4">
          {me?.paid ? (
            <>
              <p className="label text-mute">[ Your plan ]</p>
              <p className="mt-1.5 text-[16px] font-semibold text-white">{shortName(me.plan?.name ?? "")}</p>
              <Link href="/account#billing" className="mt-2 inline-block text-[13px] text-lime hover:underline">Billing</Link>
            </>
          ) : (
            <>
              <p className="text-[14px] font-semibold text-white">Unlock every clip</p>
              <p className="mt-1 text-[13px] text-mute">All clips, captions and HD export.</p>
              <button onClick={() => unlock()} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-lime px-4 text-[13px] font-semibold text-ink active:scale-95"><Sparkles className="h-3.5 w-3.5" />See plans</button>
            </>
          )}
        </div>
      </aside>

      {/* top bar (phone) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ink/80 px-4 backdrop-blur-xl md:hidden">
        <Link href="/dashboard"><Logo /></Link>
        {!me?.paid && <button onClick={() => unlock()} className="inline-flex h-8 items-center gap-1 rounded-full bg-lime px-3 text-[13px] font-semibold text-ink"><Sparkles className="h-3.5 w-3.5" />Unlock</button>}
      </header>

      <main className="mx-auto w-full max-w-[1120px] px-4 pb-32 pt-6 md:px-10 md:pb-16 md:pt-10">{children}</main>

      {/* bottom tabs (phone) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium", active(n.href) ? "text-white" : "text-white/50")}>
            <n.icon className={cn("h-[22px] w-[22px]", active(n.href) && "text-lime")} />{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-bold leading-[1.05] tracking-[-0.035em] text-white md:text-[40px]">{title}</h1>
        {sub && <p className="mt-1.5 text-[15px] text-mute">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ icon: Icon, text, action }: { icon: React.ComponentType<{ className?: string }>; text: string; action: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-[22px] border border-dashed border-line-2 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[.05] text-lime"><Icon className="h-6 w-6" /></span>
      <p className="mt-4 max-w-[320px] text-[16px] text-white/80">{text}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="rounded-[22px] border border-hot/30 bg-hot/[.05] px-6 py-10 text-center">
      <p className="text-[16px] text-white">{text}</p>
      <button onClick={onRetry} className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-ink active:scale-95">Try again</button>
    </div>
  );
}
