"use client";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function useClock() {
  const [t, setT] = useState<string>("9:41");
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M/, ""));
    f();
    const i = setInterval(f, 15000);
    return () => clearInterval(i);
  }, []);
  return t;
}

/** A realistic iPhone drawn in CSS. Children fill the 9:16-ish screen. */
export function Phone({ children, className, statusDark = false }: { children: ReactNode; className?: string; statusDark?: boolean }) {
  const time = useClock();
  return (
    <div className={cn("relative aspect-[9/19.2] w-[280px] rounded-[48px] bg-gradient-to-b from-[#2a2a2e] to-[#121214] p-[9px] shadow-[0_40px_120px_-30px_rgba(200,255,61,.25),0_0_0_1px_rgba(255,255,255,.08)_inset]", className)}>
      <div className="absolute -left-[3px] top-[22%] h-12 w-[3px] rounded-l bg-[#2a2a2e]" />
      <div className="absolute -right-[3px] top-[28%] h-20 w-[3px] rounded-r bg-[#2a2a2e]" />
      <div className="relative h-full w-full overflow-hidden rounded-[40px] bg-black">
        {children}
        <div className={cn("pointer-events-none absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between px-7 text-[13px] font-semibold", statusDark ? "text-black" : "text-white")}>
          <span style={{ fontVariantNumeric: "tabular-nums" }} suppressHydrationWarning>{time}</span>
          <span className="flex items-center gap-1">
            <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden><rect x=".5" y=".5" width="21" height="11" rx="3.5" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" /><rect x="23" y="4" width="1.5" height="4" rx=".75" fill="currentColor" opacity=".4" /></svg>
          </span>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-30 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  );
}
