"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { RotateCcw, Pause, Play, Check, X, Scissors, Captions, Clapperboard, Link2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Motion-design VSL: 7 scenes, ~63 s, built in code. public/vsl.mp4 replaces it when it exists.
const SCENES = [
  { d: 8, cap: "You recorded a 1-hour podcast." },
  { d: 9, cap: "Cutting it into TikToks? That's your whole weekend." },
  { d: 9, cap: "Then you paste one link into Vidflow." },
  { d: 10, cap: "AI watches every second and scores every moment." },
  { d: 10, cap: "30 faceless clips. Kinetic captions. B-roll. 2 minutes." },
  { d: 9, cap: "Now you post every day — without editing." },
  { d: 8, cap: "Find your first clips. Free." },
];
const TOTAL = SCENES.reduce((a, s) => a + s.d, 0);

export function Vsl({ hasVideo }: { hasVideo: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [t, setT] = useState(0);
  const [paused, setPaused] = useState(false);
  const base = useRef({ at: 0, t: 0 });
  const tRef = useRef(0);
  tRef.current = t;

  useEffect(() => {
    if (hasVideo || reduce || !inView || paused) return;
    base.current.at = performance.now();
    let raf = 0;
    let last = 0;
    const tick = (n: number) => {
      const nt = base.current.t + (n - base.current.at) / 1000;
      if (nt >= TOTAL) { setT(TOTAL - 0.01); base.current.t = TOTAL - 0.01; setPaused(true); return; }
      raf = requestAnimationFrame(tick);
      // 20 re-renders a second is plenty for captions and scene cuts; keeps the page responsive
      if (n - last < 50) return;
      last = n;
      setT(nt);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); base.current.t = tRef.current; };
  }, [inView, paused, reduce, hasVideo]);
  if (hasVideo) {
    return (
      <div className="overflow-hidden rounded-[28px] border border-line-2 bg-black">
        <video src="/vsl.mp4" autoPlay muted playsInline controls loop className="aspect-video w-full" />
      </div>
    );
  }

  let acc = 0;
  let idx = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (t < acc + SCENES[i].d) { idx = i; break; }
    acc += SCENES[i].d;
    idx = i;
  }
  const local = reduce ? 4 : t - acc;
  const ended = t >= TOTAL - 0.05;

  const replay = () => { base.current = { at: performance.now(), t: 0 }; setT(0); setPaused(false); };

  return (
    <div ref={ref} className="relative overflow-hidden rounded-[28px] border border-line-2 bg-[#09090a] shadow-[0_40px_140px_-40px_rgba(255,61,127,.35)]">
      <div className="relative aspect-[4/5] w-full sm:aspect-video">
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="absolute left-1/2 top-0 h-[60%] w-[70%] -translate-x-1/2 rounded-full bg-hot/15 blur-[90px]" />
        <AnimatePresence mode="wait">
          <motion.div key={idx} className="absolute inset-0" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.45 }}>
            {idx === 0 && <S1 t={local} />}
            {idx === 1 && <S2 t={local} />}
            {idx === 2 && <S3 t={local} />}
            {idx === 3 && <S4 t={local} />}
            {idx === 4 && <S5 t={local} />}
            {idx === 5 && <S6 t={local} />}
            {idx === 6 && <S7 t={local} />}
          </motion.div>
        </AnimatePresence>
        {/* big caption */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-5 pb-14 pt-16 text-center sm:pb-16">
          <AnimatePresence mode="wait">
            <motion.p key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}
              className="mx-auto max-w-[760px] text-[22px] font-bold leading-[1.12] tracking-[-0.03em] text-white sm:text-[34px]">
              {SCENES[idx].cap}
            </motion.p>
          </AnimatePresence>
        </div>
        {/* controls */}
        <div className="absolute inset-x-4 bottom-4 flex items-center gap-3">
          <button onClick={() => (ended ? replay() : setPaused(!paused))} aria-label={ended ? "Replay" : paused ? "Play" : "Pause"} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
            {ended ? <RotateCcw className="h-4 w-4" /> : paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <div className="flex flex-1 gap-1">
            {SCENES.map((s, i) => {
              let start = 0;
              for (let k = 0; k < i; k++) start += SCENES[k].d;
              const p = Math.max(0, Math.min(1, (t - start) / s.d));
              return <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15"><span className="block h-full bg-lime" style={{ width: `${p * 100}%` }} /></span>;
            })}
          </div>
          <button onClick={replay} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur hover:bg-white/20">Replay</button>
        </div>
      </div>
    </div>
  );
}

const stage = "absolute inset-0 flex items-center justify-center px-6 pb-28 pt-8";

function S1({ t }: { t: number }) {
  const w = Math.min(100, t * 22);
  return (
    <div className={stage}>
      <div className="w-full max-w-[620px]">
        <div className="flex items-center justify-between font-mono text-[12px] text-mute"><span>episode_47_final.mp4</span><span>1:02:44</span></div>
        <div className="mt-3 flex h-24 items-center gap-[2px] rounded-2xl border border-line-2 bg-white/[.03] p-3">
          {Array.from({ length: 90 }).map((_, i) => (
            <span key={i} className={cn("flex-1 rounded-full", i / 90 * 100 < w ? "bg-white/75" : "bg-white/15")} style={{ height: `${Math.round(20 + Math.abs(Math.sin(i * 1.3) * 60 + Math.cos(i * 0.4) * 20))}%` }} />
          ))}
        </div>
        <p className="mt-4 text-center font-mono text-[13px] text-mute">62 minutes of talking. Somewhere in there: 30 viral moments.</p>
      </div>
    </div>
  );
}

function S2({ t }: { t: number }) {
  const hours = Math.min(6, Math.floor(t * 0.9));
  const tasks = [
    { icon: Scissors, label: "Scrub for good moments" },
    { icon: Captions, label: "Type every caption" },
    { icon: Clapperboard, label: "Hunt for b-roll" },
  ];
  return (
    <div className={stage}>
      <div className="grid w-full max-w-[680px] items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div className="mx-auto text-center">
          <p className="font-mono text-[72px] font-bold leading-none text-white sm:text-[96px]" style={{ fontVariantNumeric: "tabular-nums" }}>{hours}h</p>
          <p className="label mt-2 text-hot">[ Saturday, gone ]</p>
        </div>
        <ul className="space-y-2.5">
          {tasks.map((k, i) => (
            <motion.li key={k.label} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.5 }} className="relative flex items-center gap-3 rounded-xl border border-line-2 bg-white/[.03] px-4 py-3 text-[15px] text-white/85">
              <k.icon className="h-5 w-5 text-mute" />{k.label}
              {t > 4 + i * 0.6 && <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className="absolute left-3 right-3 top-1/2 h-[2px] origin-left bg-hot" />}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function S3({ t }: { t: number }) {
  const link = "youtube.com/watch?v=ep47-podcast";
  const n = Math.min(link.length, Math.floor(Math.max(0, t - 0.6) * 14));
  const pressed = t > 4.2;
  return (
    <div className={stage}>
      <div className="w-full max-w-[600px]">
        <div className="flex items-center gap-2 rounded-full border border-line-2 bg-white/[.05] p-2">
          <Link2 className="ml-3 h-5 w-5 text-mute" />
          <span className="flex-1 truncate font-mono text-[14px] text-white sm:text-[16px]">{link.slice(0, n)}<span className="animate-blink text-lime">|</span></span>
          <motion.span animate={{ scale: pressed && t < 4.6 ? 0.94 : 1 }} className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-4 text-[14px] font-semibold text-ink sm:px-5">
            Find my clips <ArrowRight className="h-4 w-4" />
          </motion.span>
        </div>
        {pressed && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center font-mono text-[13px] text-lime">→ one link. that&apos;s the whole job.</motion.p>}
      </div>
    </div>
  );
}

function S4({ t }: { t: number }) {
  const p = Math.min(99, Math.floor(t * 14));
  const cuts = [0.1, 0.23, 0.37, 0.5, 0.64, 0.78, 0.9];
  return (
    <div className={stage}>
      <div className="w-full max-w-[640px]">
        <p className="text-center font-mono text-[64px] font-bold leading-none text-white sm:text-[88px]" style={{ fontVariantNumeric: "tabular-nums" }}>{p}<span className="text-mute">%</span></p>
        <div className="relative mt-6 flex h-20 items-center gap-[2px]">
          {Array.from({ length: 80 }).map((_, i) => <span key={i} className={cn("flex-1 rounded-full", i / 80 * 100 < p ? "bg-white/70" : "bg-white/15")} style={{ height: `${Math.round(20 + Math.abs(Math.sin(i * 1.1) * 70))}%` }} />)}
          {cuts.map((c, i) => c * 100 < p && <motion.span key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-7 flex flex-col items-center" style={{ left: `${c * 100}%` }}><span className="rounded bg-lime px-1.5 font-mono text-[10px] font-bold text-ink">{96 - i * 4}</span><span className="h-[88px] w-px bg-lime/70" /></motion.span>)}
        </div>
      </div>
    </div>
  );
}

function MiniPhone({ hue, words, delay }: { hue: number; words: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay, type: "spring", damping: 16 }} className="relative aspect-[9/16] w-[28%] max-w-[150px] overflow-hidden rounded-[18px] border-[3px] border-[#222]" style={{ background: `radial-gradient(90% 60% at 50% 30%, hsl(${hue} 90% 55%), #0b0b0d)` }}>
      <span className="absolute inset-x-1 top-[60%] text-center text-[13px] font-extrabold uppercase leading-tight text-white [-webkit-text-stroke:3px_#000] [paint-order:stroke_fill] sm:text-[16px]">{words.split(" ").map((w, i) => <span key={i} className={i === 1 ? "text-lime" : ""}>{w} </span>)}</span>
    </motion.div>
  );
}

function S5({ t }: { t: number }) {
  const count = Math.min(30, Math.floor(t * 6));
  return (
    <div className={stage}>
      <div className="w-full max-w-[640px]">
        <div className="flex items-end justify-center gap-3">
          <MiniPhone hue={330} words="Stop doing this" delay={0} />
          <MiniPhone hue={80} words="The 100K rule" delay={0.2} />
          <MiniPhone hue={20} words="Nobody tells you" delay={0.4} />
        </div>
        <p className="mt-5 text-center font-mono text-[14px] text-white/80"><span className="text-lime" style={{ fontVariantNumeric: "tabular-nums" }}>{count}</span> clips ready · 1:58</p>
      </div>
    </div>
  );
}

function S6({ t }: { t: number }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const views = Math.floor(Math.min(1, t / 7) * 284000);
  return (
    <div className={stage}>
      <div className="w-full max-w-[560px] text-center">
        <div className="flex justify-center gap-2">
          {days.map((d, i) => (
            <div key={i} className="flex w-11 flex-col items-center gap-2 rounded-xl border border-line-2 bg-white/[.03] py-3">
              <span className="font-mono text-[11px] text-mute">{d}</span>
              {t > 0.6 + i * 0.6 ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-6 w-6 place-items-center rounded-full bg-lime text-ink"><Check className="h-3.5 w-3.5" strokeWidth={3} /></motion.span> : <span className="h-6 w-6 rounded-full border border-white/15" />}
            </div>
          ))}
        </div>
        <p className="mt-6 font-mono text-[44px] font-bold text-white sm:text-[56px]" style={{ fontVariantNumeric: "tabular-nums" }}>{views.toLocaleString("en-US")}</p>
        <p className="label text-mute">[ views this week · illustration ]</p>
      </div>
    </div>
  );
}

function S7({ t }: { t: number }) {
  return (
    <div className={stage}>
      <div className="text-center">
        <motion.p initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="title-xl text-[48px] text-white sm:text-[72px]">Vidflow<span className="text-lime">.</span></motion.p>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: t > 1 ? 1 : 0 }} className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-lime px-6 text-[16px] font-semibold text-ink">Find my clips <ArrowRight className="h-4 w-4" /></motion.span>
        <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-mute"><X className="h-3.5 w-3.5" /> no card · <X className="h-3.5 w-3.5" /> no editing skills</p>
      </div>
    </div>
  );
}
