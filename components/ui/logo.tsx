import { cn } from "@/lib/utils";
import { BRAND, SLICES } from "@/lib/brand";

/** Vidflow's mark ("Clip Cut"): a play button sliced into three clips, on a black tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-7 w-7", className)} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#141416" />
      <rect x=".75" y=".75" width="62.5" height="62.5" rx="14.25" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="1.5" />
      {SLICES.map((p) => (
        <polygon key={p} points={p} fill={BRAND.lime} stroke={BRAND.lime} strokeWidth="1.6" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-[-0.03em] text-white", className)}>
      <LogoMark />
      <span className="text-[19px]">Vidflow</span>
    </span>
  );
}
