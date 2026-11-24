"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, FileText } from "lucide-react";
import { MainButton } from "@/components/ui/main-button";
import { Working } from "@/components/try/try-flow";
import { useUnlock } from "@/components/paywall/unlock-provider";
import { cn } from "@/lib/utils";

/** In-app "Find my clips": paste a YouTube link or a script, watch the work, land on the clips. */
export function LinkFinder({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { upgrade, unlock, me } = useUnlock();
  const [mode, setMode] = useState<"link" | "text">("link");
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const body = mode === "link" ? { url: val.trim() } : { text: val.trim() };
    if (!val.trim()) return setErr(mode === "link" ? "Paste a YouTube link first." : "Paste your script first.");
    setBusy(true);
    const t0 = Date.now();
    try {
      let r = await fetch("/api/try", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.status >= 500) r = await fetch("/api/try", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (Date.now() - t0 < 3000) await new Promise((x) => setTimeout(x, 3000 - (Date.now() - t0)));
      if (!r.ok) {
        setBusy(false);
        if (r.status === 402 && j.error === "quota") return upgrade("Monthly videos used");
        if (r.status === 402 && j.error === "too_long") { setErr(j.message); return upgrade("Longer videos"); }
        if (r.status === 429 && !me?.paid) { setErr(j.message); return unlock(); }
        return setErr(j.message ?? "Something went wrong. Try again.");
      }
      router.push(`/clips/${j.project.id}?new=1`);
    } catch {
      setBusy(false);
      setErr("We lost the connection. Try again.");
    }
  }

  if (busy) return <Working />;

  return (
    <form onSubmit={go} className={cn("w-full", compact ? "" : "max-w-[680px]")}>
      {mode === "link" ? (
        <div className={cn("flex flex-col gap-2 rounded-[26px] border bg-white/[.04] p-2 sm:flex-row sm:items-center sm:rounded-full", err ? "border-hot/70" : "border-line-2")}>
          <label className="flex min-w-0 flex-1 items-center gap-3 px-4">
            <Link2 className="h-5 w-5 shrink-0 text-mute" />
            <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Paste a YouTube link…" aria-label="YouTube link" inputMode="url" className="h-12 min-w-0 flex-1 bg-transparent text-[16px] text-white placeholder:text-mute-2 outline-none" />
          </label>
          <MainButton type="submit" size="md" glow={false} className="w-full sm:w-auto">Find my clips</MainButton>
        </div>
      ) : (
        <div className={cn("rounded-[22px] border bg-white/[.04] p-2", err ? "border-hot/70" : "border-line-2")}>
          <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={6} placeholder="Paste your script, article or transcript (200+ characters)…" aria-label="Script" className="w-full resize-none bg-transparent px-4 py-3 text-[16px] text-white placeholder:text-mute-2 outline-none" />
          <MainButton type="submit" size="md" glow={false} className="w-full">Find my clips</MainButton>
        </div>
      )}
      {err && <p className="mt-2 px-3 text-[14px] text-hot" role="alert">{err}</p>}
      <button type="button" onClick={() => { setMode(mode === "link" ? "text" : "link"); setVal(""); setErr(null); }} className="mt-3 inline-flex items-center gap-1.5 px-3 text-[13.5px] text-mute hover:text-white">
        {mode === "link" ? <><FileText className="h-4 w-4" />Use a script instead</> : <><Link2 className="h-4 w-4" />Use a YouTube link</>}
      </button>
    </form>
  );
}
