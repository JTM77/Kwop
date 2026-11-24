"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, LogOut, Globe, Mail, Trash2, ExternalLink } from "lucide-react";
import { PageTitle } from "@/components/app/shell";
import { useUnlock } from "@/components/paywall/unlock-provider";
import { Sheet } from "@/components/ui/sheet";
import { GhostButton } from "@/components/ui/main-button";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PLAN_COPY, shortName, tierFromName } from "@/lib/plans";

export function AccountView() {
  const router = useRouter();
  const { me, plans, unlock, upgrade, refreshMe } = useUnlock();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<{ message: string; manage_url: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delText, setDelText] = useState("");
  const plan = plans.find((p) => p.id === me?.plan?.id);
  const tier = me?.paid ? tierFromName(me.plan?.name) : "free";
  const until = me?.until ? new Date(me.until).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function cancel() {
    setBusy(true);
    const r = await fetch("/api/cancel", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    setCancelMsg({ message: j.message ?? "Your subscription is canceled.", manage_url: j.manage_url ?? null });
    refreshMe(true);
  }

  async function deleteAccount() {
    setBusy(true);
    const r = await fetch("/api/account", { method: "DELETE" });
    if (r.ok) {
      await supabaseBrowser().auth.signOut().catch(() => {});
      location.href = "/";
    } else setBusy(false);
  }

  return (
    <div>
      <PageTitle title="Account" />
      <section className="rounded-[22px] border border-line bg-white/[.025] p-5 md:p-6">
        <div className="flex items-center gap-3 text-[15px] text-white"><Mail className="h-4 w-4 text-mute" />{me?.email}</div>
        <div className="mt-3 flex items-center gap-3 text-[15px] text-white"><Globe className="h-4 w-4 text-mute" />Language: English (US)</div>
      </section>

      <section id="billing" className="mt-5 scroll-mt-20 rounded-[22px] border border-line bg-white/[.025] p-5 md:p-6">
        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-white"><CreditCard className="h-5 w-5 text-lime" />Plan & billing</h2>
        {me?.paid ? (
          <>
            <p className="mt-4 text-[26px] font-bold tracking-[-0.03em] text-white">{shortName(me.plan?.name ?? "")}</p>
            <p className="text-[14px] text-mute">{plan ? `$${(plan.price_cents / 100).toFixed(0)} / month · ${plan.per_day} a day` : ""}{until ? ` · ${me.status === "canceled" || me.status === "canceling" ? "ends" : "renews"} ${until}` : ""}</p>
            {tier !== "free" && <ul className="mt-3 space-y-1 text-[14px] text-white/75">{PLAN_COPY[tier].unlock.slice(0, 3).map((u) => <li key={u}>· {u}</li>)}</ul>}
            <div className="mt-5 flex flex-wrap gap-2">
              <GhostButton onClick={() => upgrade("Change plan")}>Change plan</GhostButton>
              <GhostButton onClick={() => setCancelOpen(true)}>Cancel my subscription</GhostButton>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-[15px] text-white/80">You&apos;re on the free try. Your first clip of each video is open.</p>
            <button onClick={() => unlock()} className="mt-4 inline-flex h-10 items-center rounded-full bg-lime px-5 text-[14px] font-semibold text-ink active:scale-95">See plans</button>
          </>
        )}
      </section>

      <section className="mt-5 flex flex-wrap gap-2">
        <GhostButton onClick={logout}><LogOut className="h-4 w-4" />Log out</GhostButton>
        <GhostButton onClick={() => setDelOpen(true)} className="text-hot"><Trash2 className="h-4 w-4" />Delete my account</GhostButton>
      </section>

      <Sheet open={cancelOpen} onClose={() => { setCancelOpen(false); setCancelMsg(null); }} label="Cancel subscription" width={440}>
        <div className="px-6 pb-8 pt-14">
          {cancelMsg ? (
            <>
              <h2 className="text-[22px] font-semibold text-white">Done</h2>
              <p className="mt-2 text-[15px] text-white/80">{cancelMsg.message}</p>
              {cancelMsg.manage_url && <a href={cancelMsg.manage_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[14px] text-lime hover:underline">Manage your subscription <ExternalLink className="h-3.5 w-3.5" /></a>}
            </>
          ) : (
            <>
              <h2 className="text-[22px] font-semibold text-white">Cancel your subscription?</h2>
              <p className="mt-2 text-[15px] text-mute">You keep {shortName(me?.plan?.name ?? "your plan")} until the end of this period{until ? ` (${until})` : ""}. Your clips stay in your account.</p>
              <div className="mt-6 flex gap-2">
                <GhostButton className="flex-1" onClick={() => setCancelOpen(false)}>Keep my plan</GhostButton>
                <button onClick={cancel} disabled={busy} className="h-11 flex-1 rounded-full bg-hot text-[15px] font-semibold text-white active:scale-95 disabled:opacity-60">{busy ? "Canceling…" : "Cancel subscription"}</button>
              </div>
            </>
          )}
        </div>
      </Sheet>

      <Sheet open={delOpen} onClose={() => setDelOpen(false)} label="Delete account" width={440}>
        <div className="px-6 pb-8 pt-14">
          <h2 className="text-[22px] font-semibold text-white">Delete your account?</h2>
          <p className="mt-2 text-[15px] text-mute">Your account, every video and every clip are deleted for good{me?.paid ? ", and your subscription is canceled" : ""}. Type DELETE to confirm.</p>
          <input value={delText} onChange={(e) => setDelText(e.target.value)} aria-label="Type DELETE" className="mt-4 h-12 w-full rounded-2xl border border-line-2 bg-white/[.04] px-4 text-[16px] text-white outline-none focus:border-hot" />
          <button onClick={deleteAccount} disabled={delText !== "DELETE" || busy} className="mt-4 h-12 w-full rounded-full bg-hot text-[15px] font-semibold text-white disabled:opacity-40">{busy ? "Deleting…" : "Delete my account"}</button>
        </div>
      </Sheet>
    </div>
  );
}
