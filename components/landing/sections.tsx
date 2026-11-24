"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Clock, Captions, Clapperboard, Download, Flame, Link2, Scissors, Sparkles, X } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/label";
import { CountUp } from "@/components/ui/count-up";
import { KineticCaptions } from "@/components/ui/kinetic";
import type { Caption } from "@/lib/captions";
import { cn } from "@/lib/utils";

function useLoop(len: number) {
  const reduce = useReducedMotion();
  const [t, setT] = useState(reduce ? len * 0.6 : 0);
  useEffect(() => {
    if (reduce) return;
    const t0 = performance.now();
    let raf = 0;
    const f = (n: number) => { setT(((n - t0) / 1000) % len); raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [len, reduce]);
  return t;
}

/* ───────── The problem (light) ───────── */
export function Problem() {
  const pains = [
    { icon: Clock, title: "Editing eats your week", body: "One long video takes 4 to 6 hours to cut, caption and export by hand." },
    { icon: Scissors, title: "Finding hooks is exhausting", body: "You scrub through an hour of talk hoping to spot the 30 seconds people will actually watch." },
    { icon: Captions, title: "Captions and b-roll are tedious", body: "Typing every word, timing every pop, hunting stock footage for every line. Again tomorrow." },
  ];
  return (
    <section className="bg-paper py-16 text-ink md:py-28">
      <div className="mx-auto max-w-[1120px] px-5">
        <Reveal>
          <SectionLabel dark={false}>The problem</SectionLabel>
          <h2 className="title-xl mt-4 max-w-[760px] text-[40px] md:text-[64px]">Posting daily shouldn&apos;t cost you <span className="text-zinc-400">every weekend.</span></h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
          {pains.map((p) => (
            <StaggerItem key={p.title} className="rounded-[20px] border border-black/[.07] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,.03)]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-lime"><p.icon className="h-5 w-5" /></span>
              <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.02em]">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">{p.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────── How it works (dark, animated device frames) ───────── */
function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[18px] border border-line-2 bg-[#0e0e10]", className)}>
      <div className="flex h-8 items-center gap-1.5 border-b border-line px-3"><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /></div>
      <div className="relative h-[190px] p-4">{children}</div>
    </div>
  );
}

function StepUpload() {
  const t = useLoop(5);
  const link = "youtube.com/watch?v=podcast-ep12";
  const n = Math.min(link.length, Math.floor(t * 16));
  return (
    <Frame>
      <p className="text-[12px] text-mute">New project</p>
      <div className="mt-3 flex items-center gap-2 rounded-full border border-line-2 bg-white/[.04] px-3 py-2.5">
        <Link2 className="h-4 w-4 text-mute" />
        <span className="truncate font-mono text-[12.5px] text-white">{link.slice(0, n)}<span className="animate-blink text-lime">|</span></span>
      </div>
      <div className={cn("mt-3 inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition", t > 2.6 ? "bg-lime text-ink" : "bg-white/10 text-white/50")}>Find my clips <ArrowRight className="h-3.5 w-3.5" /></div>
      <p className="mt-4 text-[12px] text-mute">or drop your .mp4 — it stays on your device</p>
    </Frame>
  );
}

function StepGenerate() {
  const t = useLoop(5);
  const p = Math.min(1, t / 4);
  return (
    <Frame>
      <div className="flex items-center justify-between text-[12px] text-mute"><span>Scoring moments</span><span className="font-mono text-white">{Math.floor(p * 99)}%</span></div>
      <div className="relative mt-4 flex h-24 items-center gap-[2px]">
        {Array.from({ length: 48 }).map((_, i) => <span key={i} className={cn("flex-1 rounded-full", i / 48 < p ? "bg-white/70" : "bg-white/15")} style={{ height: `${Math.round(25 + Math.abs(Math.sin(i * 1.4) * 65))}%` }} />)}
        {[0.15, 0.42, 0.7].map((c, i) => c < p && <span key={i} className="absolute top-0 h-full w-[12%] rounded border border-lime bg-lime/15" style={{ left: `${c * 100}%` }} />)}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-white/80"><Flame className="h-3.5 w-3.5 text-flame" /> {[0.15, 0.42, 0.7].filter((c) => c < p).length} viral moments found</p>
    </Frame>
  );
}

function StepExport() {
  const t = useLoop(5);
  return (
    <Frame>
      <div className="flex h-full items-center gap-4">
        <div className="relative aspect-[9/16] h-full overflow-hidden rounded-xl border-2 border-[#222]" style={{ background: "radial-gradient(90% 60% at 50% 30%, #ff3d7f, #0b0b0d)" }}>
          <span className="absolute inset-x-1 top-[58%] text-center text-[11px] font-extrabold uppercase leading-tight text-white [-webkit-text-stroke:2px_#000] [paint-order:stroke_fill]">Stop <span className="text-lime">doing</span> this</span>
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-lime" style={{ width: `${Math.min(100, t * 30)}%` }} /></div>
          <p className="text-[12px] text-mute">{t < 3.3 ? "Rendering 1080×1920…" : "Ready to post"}</p>
          <div className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold transition", t >= 3.3 ? "bg-lime text-ink" : "bg-white/10 text-white/40")}><Download className="h-3.5 w-3.5" /> Download</div>
          <p className="text-[11px] text-mute-2">TikTok · Reels · Shorts</p>
        </div>
      </div>
    </Frame>
  );
}

export function HowItWorks() {
  const steps = [
    { n: "01", title: "Paste or drop", body: "Drop your long video or paste a YouTube podcast link.", el: <StepUpload /> },
    { n: "02", title: "AI cuts the best moments", body: "Vidflow reads the transcript, scores every moment for hooks and cuts the best clips.", el: <StepGenerate /> },
    { n: "03", title: "Download & post", body: "Vertical clips with kinetic captions and b-roll, ready for TikTok, Reels and Shorts.", el: <StepExport /> },
  ];
  return (
    <section id="how" className="scroll-mt-24 py-16 md:py-28">
      <div className="mx-auto max-w-[1120px] px-5">
        <Reveal>
          <SectionLabel>How it works</SectionLabel>
          <h2 className="title-xl mt-4 text-[40px] text-white md:text-[64px]">Three steps. <span className="grad-text">About two minutes.</span></h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <StaggerItem key={s.n}>
              {s.el}
              <p className="mt-5 font-mono text-[12px] text-lime">{s.n}</p>
              <h3 className="mt-1 text-[21px] font-semibold tracking-[-0.02em] text-white">{s.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-mute">{s.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────── Features: a short animated loop of each ───────── */
const CAPS: Caption[] = [
  { t: 0.1, e: 1.3, text: "This one habit" },
  { t: 1.3, e: 2.6, text: "changed my whole life." },
  { t: 2.8, e: 4.2, text: "And it takes 5 minutes." },
];

function LoopFinder() {
  const t = useLoop(6);
  const rows = [{ s: 94, l: "The 5-minute habit" }, { s: 88, l: "Why most people quit" }, { s: 81, l: "My worst money mistake" }];
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.l} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-500", t > 0.8 + i * 0.9 ? "border-line-2 bg-white/[.04] opacity-100" : "border-transparent opacity-0 translate-y-2")}>
          <span className="font-mono text-[12px] font-bold text-lime">#{i + 1}</span>
          <span className="flex-1 truncate text-[13.5px] text-white">{r.l}</span>
          <span className="flex w-20 items-center gap-1.5"><span className="h-1.5 flex-1 rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-hot to-flame" style={{ width: `${r.s}%` }} /></span><span className="font-mono text-[11px] text-white">{r.s}</span></span>
        </div>
      ))}
    </div>
  );
}

function LoopCaptions() {
  const t = useLoop(4.6);
  return (
    <div className="relative mx-auto aspect-[9/12] w-[170px] overflow-hidden rounded-2xl border-2 border-[#222]" style={{ background: "radial-gradient(90% 70% at 50% 20%, #3a1d5c, #0b0b0d)" }}>
      <KineticCaptions captions={CAPS} time={t} styleId="karaoke" size={0.7} className="top-[48%]" />
    </div>
  );
}

function LoopBroll() {
  const t = useLoop(6);
  const scene = Math.floor(t / 2);
  const bgs = ["linear-gradient(160deg,#0f2027,#2c5364)", "linear-gradient(160deg,#3a1c71,#d76d77)", "linear-gradient(160deg,#134e5e,#71b280)"];
  const kw = ["city night traffic", "money on table", "sunrise mountain"];
  return (
    <div className="flex items-center gap-4">
      <div className="relative aspect-[9/16] w-[96px] shrink-0 overflow-hidden rounded-xl border-2 border-[#222]">
        <AnimatePresence mode="popLayout"><motion.div key={scene} className="absolute inset-0" style={{ background: bgs[scene] }} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} /></AnimatePresence>
      </div>
      <div className="space-y-1.5">
        {kw.map((k, i) => <p key={k} className={cn("rounded-lg px-2.5 py-1.5 font-mono text-[12px] transition", i === scene ? "bg-lime text-ink" : "bg-white/[.05] text-mute")}>{k}</p>)}
      </div>
    </div>
  );
}

function LoopExport() {
  const t = useLoop(5);
  const fmts = ["TikTok", "Reels", "Shorts"];
  return (
    <div className="flex items-end justify-center gap-3">
      {fmts.map((f, i) => (
        <div key={f} className="flex flex-col items-center gap-2">
          <div className="relative aspect-[9/16] w-[62px] overflow-hidden rounded-lg border-2 border-[#222] bg-white/[.04]">
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-lime/70 to-lime/10" style={{ height: `${Math.min(100, Math.max(0, (t - i * 0.5) * 45))}%` }} />
            {t - i * 0.5 > 2.2 && <Check className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-ink" strokeWidth={3} />}
          </div>
          <span className="text-[11.5px] text-mute">{f}</span>
        </div>
      ))}
    </div>
  );
}

export function Features() {
  const items = [
    { icon: Sparkles, name: "AI Clip Finder", body: "Scans your whole video and pulls the moments with the strongest hooks, each with a virality score.", loop: <LoopFinder /> },
    { icon: Captions, name: "Kinetic Captions", body: "Word-by-word animated subtitles in 6 styles that keep thumbs from scrolling.", loop: <LoopCaptions /> },
    { icon: Clapperboard, name: "Smart B-Roll", body: "Matches background footage to what's being said, so faceless clips never feel static.", loop: <LoopBroll /> },
    { icon: Download, name: "One-Click Export", body: "Vertical 9:16, sized for TikTok, Reels and Shorts. Download and post.", loop: <LoopExport /> },
  ];
  return (
    <section id="features" className="scroll-mt-24 border-t border-line py-16 md:py-28">
      <div className="mx-auto max-w-[1120px] px-5">
        <Reveal>
          <SectionLabel>Features</SectionLabel>
          <h2 className="title-xl mt-4 max-w-[980px] text-[40px] text-white md:text-[64px]">Everything a faceless clip needs. <span className="grad-text">Nothing you have to do.</span></h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-4 md:grid-cols-2">
          {items.map((f) => (
            <StaggerItem key={f.name} className="flex flex-col rounded-[22px] border border-line bg-white/[.025] p-6">
              <div className="grid min-h-[190px] place-items-center rounded-[16px] border border-line bg-[#0c0c0d] p-5">{f.loop}</div>
              <div className="mt-5 flex items-center gap-2"><f.icon className="h-5 w-5 text-lime" /><h3 className="text-[20px] font-semibold tracking-[-0.02em] text-white">{f.name}</h3></div>
              <p className="mt-2 text-[15px] leading-relaxed text-mute">{f.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────── What changes: the usual way vs Vidflow (light) ───────── */
export function Compare() {
  const rows = [
    ["Time per long video", "4–6 hours", "About 2 minutes"],
    ["Finding the hooks", "Scrub and guess", "Every moment scored"],
    ["Captions", "Typed and timed by hand", "Kinetic, word by word"],
    ["B-roll", "Search stock sites", "Matched to the words"],
    ["Clips per video", "2 or 3 if you're lucky", "Up to 10"],
  ];
  return (
    <section className="bg-paper py-16 text-ink md:py-28">
      <div className="mx-auto max-w-[1120px] px-5">
        <Reveal>
          <SectionLabel dark={false}>What changes</SectionLabel>
          <h2 className="title-xl mt-4 text-[40px] md:text-[64px]">The usual way <span className="text-zinc-400">vs Vidflow.</span></h2>
        </Reveal>
        <Reveal className="mt-10 overflow-hidden rounded-[22px] border border-black/[.08] bg-white">
          <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-black/[.06] px-4 py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-zinc-500 md:px-6">
            <span /> <span>By hand</span> <span className="text-ink">Vidflow</span>
          </div>
          {rows.map((r) => (
            <div key={r[0]} className="grid grid-cols-[1.1fr_1fr_1fr] items-center gap-2 border-b border-black/[.05] px-4 py-4 text-[14px] last:border-0 md:px-6 md:text-[16px]">
              <span className="font-medium">{r[0]}</span>
              <span className="flex items-center gap-1.5 text-zinc-500"><X className="hidden h-4 w-4 shrink-0 text-zinc-400 sm:block" />{r[1]}</span>
              <span className="flex items-center gap-1.5 font-semibold"><Check className="hidden h-4 w-4 shrink-0 text-[#5a8f00] sm:block" />{r[2]}</span>
            </div>
          ))}
        </Reveal>
        <Stagger className="mt-10 grid grid-cols-3 gap-3 text-center">
          {[{ v: 10, s: "", l: "clips per video" }, { v: 6, s: "", l: "caption styles" }, { v: 60, s: "s", l: "to your first clip" }].map((x) => (
            <StaggerItem key={x.l} className="rounded-[18px] border border-black/[.07] bg-white px-2 py-5">
              <p className="title-xl text-[40px] md:text-[56px]"><CountUp to={x.v} />{x.s}</p>
              <p className="mt-1 text-[13px] text-zinc-500 md:text-[14px]">{x.l}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────── Questions ───────── */
const QA = [
  { q: "Do I need to show my face?", a: "No. Vidflow is built for faceless channels: clips from podcasts, talks and voice-overs, with kinetic captions and b-roll carrying the visuals." },
  { q: "What videos can I use?", a: "Paste a public YouTube link to find your clips, or upload your own video file once you're in. Podcasts, interviews, talks, lessons and storytimes work best — anything where people talk." },
  { q: "Can I use clips from other people's videos?", a: "Only if you have the rights. Vidflow is made for your own content or content you're licensed to repost. To export, you upload your own copy of the video." },
  { q: "Does it work for TikTok, Reels and Shorts?", a: "Yes. Every clip is vertical 9:16, under 60 seconds, with captions placed in the safe zone of all three apps." },
  { q: "How good is the AI at picking moments?", a: "It reads the full transcript and scores every moment for hook strength, emotion and payoff, then shows you why. You see your first clip before you sign up, so you can judge it yourself." },
  { q: "How much does it cost?", a: "You try it free first. The plans show up once your first clips are ready." },
];

export function Questions() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-24 py-16 md:py-28">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-5 md:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <SectionLabel>Questions</SectionLabel>
          <h2 className="title-xl mt-4 text-[40px] text-white md:text-[56px]">The real doubts, <span className="grad-text">answered.</span></h2>
        </Reveal>
        <Reveal className="divide-y divide-line rounded-[22px] border border-line">
          {QA.map((x, i) => (
            <div key={x.q}>
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-[16px] font-medium text-white md:text-[17px]" aria-expanded={open === i}>
                {x.q}<ChevronDown className={cn("h-5 w-5 shrink-0 text-mute transition", open === i && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <p className="px-5 pb-5 text-[15px] leading-relaxed text-mute">{x.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── Final CTA ───────── */
export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute left-1/2 top-1/2 h-[480px] w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,61,127,.28),rgba(255,138,61,.12),transparent)] blur-2xl" />
      <Reveal className="relative mx-auto max-w-[860px] px-5 text-center">
        <SectionLabel>Tonight</SectionLabel>
        <h2 className="title-xl mt-4 text-[44px] text-white md:text-[80px]">Tonight, your first 10 clips <span className="hot-text">are posted.</span></h2>
        <p className="mx-auto mt-5 max-w-[520px] text-[17px] text-mute">Paste the long video you already made. Vidflow does the cutting, captions and b-roll.</p>
        <a href="#try" className="group relative isolate mt-9 inline-flex rounded-full transition-transform active:scale-[.955]">
          <span aria-hidden className="absolute -inset-2 -z-10 rounded-full bg-lime/40 blur-2xl animate-breathe" />
          <span className="inline-flex h-[64px] items-center gap-4 rounded-full bg-lime pl-8 pr-2 text-[18px] font-semibold text-ink">
            Find my clips
            <span className="grid h-[48px] w-[48px] place-items-center rounded-full bg-ink text-lime"><ArrowRight className="h-5 w-5 animate-nudge" /></span>
          </span>
        </a>
        <p className="mt-5 font-mono text-[12px] text-mute">Free to try · No card · Clips in ~60 seconds</p>
      </Reveal>
    </section>
  );
}

/* ───────── Sticky main button on phones ───────── */
export function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById("try");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0 && !document.body.dataset.result), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: "spring", damping: 26 }} className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 md:hidden">
          <a href="#try" className="flex h-[56px] items-center justify-between rounded-full bg-lime pl-6 pr-1.5 text-[16px] font-semibold text-ink shadow-[0_10px_40px_rgba(200,255,61,.35)] active:scale-[.97]">
            Find my clips <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-lime"><ArrowRight className="h-5 w-5 animate-nudge" /></span>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
