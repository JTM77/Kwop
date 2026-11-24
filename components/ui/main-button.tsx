"use client";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type Common = { children: ReactNode; size?: "lg" | "md" | "sm"; className?: string; glow?: boolean; loading?: boolean; arrow?: boolean };

function Inner({ children, size = "lg", glow = true, loading, arrow = true }: Common) {
  const h = size === "lg" ? "h-[62px] pl-7 pr-2 text-[17px]" : size === "md" ? "h-[52px] pl-6 pr-1.5 text-[16px]" : "h-10 pl-4 pr-1 text-[14px]";
  const dot = size === "lg" ? "h-[46px] w-[46px]" : size === "md" ? "h-10 w-10" : "h-8 w-8";
  return (
    <>
      {glow && <span aria-hidden className="pointer-events-none absolute -inset-2 -z-10 rounded-full bg-lime/40 blur-2xl animate-breathe" />}
      <span className={cn("relative inline-flex w-full items-center justify-between gap-4 rounded-full bg-lime font-semibold text-ink", h, !arrow && "pr-7 justify-center")}>
        <span className="truncate">{children}</span>
        {arrow && (
          <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-lime", dot)}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="relative block h-5 w-5">
                <ArrowRight className="absolute inset-0 h-5 w-5 animate-nudge transition-transform duration-300 group-hover:translate-x-7" />
                <ArrowRight className="absolute inset-0 h-5 w-5 -translate-x-7 transition-transform duration-300 group-hover:translate-x-0" />
              </span>
            )}
          </span>
        )}
      </span>
    </>
  );
}

const base = "group relative isolate inline-flex select-none rounded-full transition-transform duration-150 active:scale-[.955] disabled:opacity-60 disabled:pointer-events-none";

export function MainButton(props: Common & Omit<ComponentProps<"button">, "children">) {
  const { children, size, className, glow, loading, arrow, ...rest } = props;
  return (
    <button {...rest} className={cn(base, className)} disabled={rest.disabled || loading}>
      <Inner size={size} glow={glow} loading={loading} arrow={arrow}>{children}</Inner>
    </button>
  );
}

export function MainLink(props: Common & { href: string; onClick?: () => void }) {
  const { children, size, className, glow, href, arrow, onClick } = props;
  return (
    <Link href={href} onClick={onClick} className={cn(base, className)}>
      <Inner size={size} glow={glow} arrow={arrow}>{children}</Inner>
    </Link>
  );
}

export function GhostButton({ className, ...rest }: ComponentProps<"button">) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line-2 bg-white/[.04] px-5 text-[15px] font-medium text-white transition hover:bg-white/[.08] active:scale-[.97] disabled:opacity-50",
        className,
      )}
    />
  );
}
