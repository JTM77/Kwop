"use client";
import type { Usage } from "@/components/app/use-projects";
import { useUnlock } from "@/components/paywall/unlock-provider";

export function UsageMeter({ usage }: { usage: Usage }) {
  const { upgrade, unlock } = useUnlock();
  if (usage.tier === "free") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-line bg-white/[.025] px-5 py-4">
        <p className="text-[14.5px] text-white/85">You&apos;re on the free try: 3 videos a day, first clip of each unlocked.</p>
        <button onClick={() => unlock()} className="h-9 rounded-full bg-lime px-4 text-[13px] font-semibold text-ink active:scale-95">Unlock every clip</button>
      </div>
    );
  }
  const pct = Math.min(100, (usage.used / Math.max(1, usage.limit)) * 100);
  const left = Math.max(0, usage.limit - usage.used);
  return (
    <div className="rounded-[18px] border border-line bg-white/[.025] px-5 py-4">
      <div className="flex items-center justify-between text-[14px]">
        <span className="text-white/85"><b className="text-white">{usage.used}</b> of {usage.limit} videos this month</span>
        <span className="font-mono text-[12px] text-mute">{left * 10} clips left</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-lime to-flame" style={{ width: `${pct}%` }} /></div>
      {pct >= 75 && usage.tier !== "pro" && <button onClick={() => upgrade("Running low")} className="mt-3 text-[13px] font-medium text-lime hover:underline">Get more videos →</button>}
    </div>
  );
}
