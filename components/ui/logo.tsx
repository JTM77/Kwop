import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#c8ff3d" />
      <path d="M8 9.5h4.2l3.8 10.2 3.8-10.2H24L18 23h-4L8 9.5Z" fill="#060606" />
      <rect x="21" y="19" width="5" height="5" rx="1.6" fill="#ff3d7f" />
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
