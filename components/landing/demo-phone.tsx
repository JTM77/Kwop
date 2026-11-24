"use client";
import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share, Bookmark, Music2 } from "lucide-react";
import { useInView, useReducedMotion } from "framer-motion";
import { useAfterLoad, useClock } from "@/lib/use-clock";
import { Phone } from "@/components/ui/phone";
import { KineticCaptions } from "@/components/ui/kinetic";
import type { Caption } from "@/lib/captions";
import { fmtCompact } from "@/lib/utils";

// Example clip (illustration): a faceless finance clip with kinetic captions.
const CAPTIONS: Caption[] = [
  { t: 0.2, e: 1.6, text: "Nobody tells you this" },
  { t: 1.6, e: 2.9, text: "about money." },
  { t: 3.1, e: 5.0, text: "The first 100K is the hardest." },
  { t: 5.2, e: 7.0, text: "After that, your money works" },
  { t: 7.0, e: 8.4, text: "while you sleep." },
];
const LOOP = 9;

function Scene({ i, t }: { i: number; t: number }) {
  if (i === 0)
    return (
      <svg viewBox="0 0 270 560" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a0b2e" /><stop offset="1" stopColor="#ff3d7f" stopOpacity=".55" /></linearGradient></defs>
        <rect width="270" height="560" fill="url(#sky)" />
        {Array.from({ length: 14 }).map((_, k) => {
          const h = 140 + ((k * 53) % 180);
          return <rect key={k} x={k * 20 - 6} y={560 - h} width="18" height={h} fill="#0b0712" />;
        })}
        {Array.from({ length: 40 }).map((_, k) => (
          <rect key={`w${k}`} x={(k * 37) % 270} y={330 + ((k * 61) % 200)} width="3" height="4" fill="#ffd27a" opacity={0.3 + 0.7 * Math.abs(Math.sin(t * 2 + k))} />
        ))}
      </svg>
    );
  if (i === 1)
    return (
      <svg viewBox="0 0 270 560" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="270" height="560" fill="#07140a" />
        {Array.from({ length: 12 }).map((_, k) => <line key={k} x1="0" x2="270" y1={k * 48} y2={k * 48} stroke="#1f3a22" />)}
        <polyline fill="none" stroke="#c8ff3d" strokeWidth="4" strokeLinejoin="round"
          points="0,470 30,455 60,462 90,430 120,440 150,390 180,360 210,300 240,220 270,140"
          strokeDasharray="600" strokeDashoffset={600 - Math.min(600, ((t - 3) / 2.2) * 600)} />
      </svg>
    );
  return (
    <svg viewBox="0 0 270 560" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs><radialGradient id="sun" cx="50%" cy="62%" r="60%"><stop offset="0" stopColor="#ffb347" /><stop offset=".4" stopColor="#ff6a3d" /><stop offset="1" stopColor="#1b0d24" /></radialGradient></defs>
      <rect width="270" height="560" fill="url(#sun)" />
      <circle cx="135" cy={360 - (t - 6) * 8} r="46" fill="#fff3c4" opacity=".9" />
      <rect y="400" width="270" height="160" fill="#140a18" />
    </svg>
  );
}

export function DemoPhone({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });
  const loaded = useAfterLoad();
  const live = !reduce && loaded && inView;
  const [t] = useClock({ active: live, fps: 15, loop: LOOP, from: 3.6 });
  const [views, setViews] = useState(48200);
  useEffect(() => {
    if (!live) return;
    const v = setInterval(() => setViews((x) => x + Math.floor(80 + Math.random() * 300)), 900);
    return () => clearInterval(v);
  }, [live]);
  const scene = t < 3 ? 0 : t < 6 ? 1 : 2;
  return (
    <div className={className} ref={ref}>
      <Phone className="w-[262px] md:w-[290px]">
        <div className="absolute inset-0"><Scene i={scene} t={t} /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
        <div className="absolute inset-x-0 top-12 z-20 flex justify-center gap-4 text-[13px] font-semibold text-white/60"><span>Following</span><span className="text-white">For You</span></div>
        <KineticCaptions captions={CAPTIONS} time={t} styleId="pop" size={0.95} className="left-3 right-14 top-[52%]" />
        <div className="absolute bottom-24 right-2.5 z-20 flex flex-col items-center gap-4 text-white">
          <span className="flex flex-col items-center text-[11px] font-semibold"><Heart className="h-7 w-7 fill-white" />{fmtCompact(views * 0.11)}</span>
          <span className="flex flex-col items-center text-[11px] font-semibold"><MessageCircle className="h-7 w-7 fill-white" />{fmtCompact(views * 0.004)}</span>
          <span className="flex flex-col items-center text-[11px] font-semibold"><Bookmark className="h-7 w-7 fill-white" />{fmtCompact(views * 0.02)}</span>
          <span className="flex flex-col items-center text-[11px] font-semibold"><Share className="h-7 w-7" />{fmtCompact(views * 0.008)}</span>
        </div>
        <div className="absolute inset-x-3 bottom-6 z-20 text-white">
          <p className="text-[13px] font-semibold">@moneyinminutes</p>
          <p className="mt-0.5 text-[12px] text-white/85">The 100K rule nobody explains #money #finance</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-white/70"><Music2 className="h-3 w-3" /> original sound</p>
        </div>
      </Phone>
      <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-line-2 bg-white/[.04] px-3.5 py-1.5 font-mono text-[12px] text-white/80 backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-hot" />
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{views.toLocaleString("en-US")}</span> views · example clip
      </div>
    </div>
  );
}
