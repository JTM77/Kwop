"use client";
import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { PageTitle } from "@/components/app/shell";
import { useUnlock } from "@/components/paywall/unlock-provider";
import { CAPTION_STYLES } from "@/lib/captions";
import { canUseStyle } from "@/components/result-view";
import { KineticCaptions } from "@/components/ui/kinetic";
import { QUOTAS } from "@/lib/plans";
import { cn } from "@/lib/utils";

const SAMPLE = [{ t: 0, e: 1.4, text: "This changes everything" }, { t: 1.4, e: 2.8, text: "about how you post." }];
const SWATCHES = ["#c8ff3d", "#ff3d7f", "#3dfff0", "#ffe600", "#ff8a3d", "#a78bfa"];

export function SettingsView() {
  const { me, upgrade } = useUnlock();
  const tier = me?.tier ?? "free";
  const [style, setStyle] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [t, setT] = useState(0);

  useEffect(() => {
    fetch("/api/account").then((r) => r.json()).then((j) => { setStyle(j.profile?.caption_style ?? "pop"); setBrand(j.profile?.brand_color ?? null); }).catch(() => setStyle("pop"));
    const i = setInterval(() => setT((x) => (x + 0.05) % 3), 50);
    return () => clearInterval(i);
  }, []);

  async function save(patch: Record<string, unknown>) {
    const r = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 1600); }
  }

  return (
    <div>
      <PageTitle title="Settings" sub="Your default look for every new clip." right={saved ? <span className="inline-flex items-center gap-1.5 text-[14px] text-lime"><Check className="h-4 w-4" />Saved</span> : null} />

      <section className="rounded-[22px] border border-line bg-white/[.025] p-5 md:p-6">
        <h2 className="text-[18px] font-semibold text-white">Default caption style</h2>
        <p className="mt-1 text-[14px] text-mute">Kinetic captions on every new clip.</p>
        {style === null ? <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-[148px] rounded-2xl" />)}</div> : (
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
            {CAPTION_STYLES.map((s) => {
              const ok = canUseStyle(s.id, tier);
              return (
                <button key={s.id} onClick={() => { if (!ok) return upgrade("All 6 caption styles"); setStyle(s.id); save({ caption_style: s.id }); }}
                  className={cn("relative overflow-hidden rounded-2xl border text-left transition active:scale-[.98]", style === s.id ? "border-lime shadow-[0_0_0_1px_var(--color-lime)_inset]" : "border-line-2 hover:border-white/30")}>
                  <div className="relative h-[110px] bg-[radial-gradient(90%_80%_at_50%_10%,#3a1d5c,#0b0b0d)]">
                    <KineticCaptions captions={SAMPLE} time={t} styleId={s.id} brand={tier === "pro" ? brand : null} size={0.62} className="top-[38%]" />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 text-[14px] font-medium text-white">
                    {s.name}{!ok ? <Lock className="h-4 w-4 text-mute" /> : style === s.id ? <Check className="h-4 w-4 text-lime" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-5 rounded-[22px] border border-line bg-white/[.025] p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold text-white">Brand color</h2>
            <p className="mt-1 text-[14px] text-mute">The highlight color of your captions, on every clip.</p>
          </div>
          {tier !== "pro" && <button onClick={() => upgrade("Brand colors")} className="inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3 py-1.5 text-[13px] text-white/80"><Lock className="h-3.5 w-3.5" />Pro</button>}
        </div>
        <div className={cn("mt-4 flex flex-wrap items-center gap-3", tier !== "pro" && "pointer-events-none opacity-40 blur-[1px]")}>
          {SWATCHES.map((c) => (
            <button key={c} onClick={() => { setBrand(c); save({ brand_color: c }); }} aria-label={`Brand color ${c}`} className={cn("h-10 w-10 rounded-full border-2 transition", brand === c ? "border-white scale-110" : "border-transparent")} style={{ background: c }} />
          ))}
          <label className="flex h-10 items-center gap-2 rounded-full border border-line-2 px-3 text-[13px] text-white/80">
            Custom <input type="color" value={brand ?? "#c8ff3d"} onChange={(e) => setBrand(e.target.value)} onBlur={(e) => save({ brand_color: e.target.value })} className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent" />
          </label>
        </div>
      </section>

      <section className="mt-5 rounded-[22px] border border-line bg-white/[.025] p-5 md:p-6">
        <h2 className="text-[18px] font-semibold text-white">Export</h2>
        <p className="mt-1 text-[14px] text-mute">Vertical 9:16 · {QUOTAS[tier].exportHeight === 1080 ? "1080×1920" : "720×1280"} · {QUOTAS[tier].fps}fps · rendered on your device</p>
        {tier !== "creator" && tier !== "pro" && <button onClick={() => upgrade("1080p HD export")} className="mt-3 text-[14px] font-medium text-lime hover:underline">Get 1080p HD →</button>}
      </section>
    </div>
  );
}
