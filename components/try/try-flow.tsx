"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Link2, Lock, Mic, Lightbulb, Brain, FileText, Loader2, RotateCcw, Share2 } from "lucide-react";
import { MainButton } from "@/components/ui/main-button";
import { ResultView } from "@/components/result-view";
import { useUnlock } from "@/components/paywall/unlock-provider";
import type { PublicProject } from "@/lib/types";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  { label: "Commencement speech", icon: Mic, url: "https://www.youtube.com/watch?v=UF8uR6Z6KLc" },
  { label: "Leadership talk", icon: Lightbulb, url: "https://www.youtube.com/watch?v=qp0HIF3SfI4" },
  { label: "Psychology talk", icon: Brain, url: "https://www.youtube.com/watch?v=iCvmsMzlF7o" },
];

const STEPS = ["Watching your video", "Writing the transcript", "Scoring every moment for hooks", "Cutting the best clips", "Timing kinetic captions", "Matching b-roll"];

type Phase = { k: "idle" } | { k: "working"; started: number } | { k: "ready"; project: PublicProject; fresh: boolean } | { k: "error"; message: string };

export function TryFlow({ initialProject, autoUnlock }: { initialProject?: PublicProject | null; autoUnlock?: boolean }) {
  const { me, plans, unlock, onUnlocked } = useUnlock();
  const [mode, setMode] = useState<"link" | "text">("link");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [inputErr, setInputErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>(initialProject ? { k: "ready", project: initialProject, fresh: false } : { k: "idle" });
  const [style, setStyle] = useState("pop");
  const lastInput = useRef<{ url?: string; text?: string } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const creator = plans.find((p) => /creator/i.test(p.name)) ?? plans[1];

  const project = phase.k === "ready" ? phase.project : null;
  const best = project?.bestScore ?? null;
  const ctx = project
    ? { title: `Your ${project.clips.length} clips are ready.`, line: `From “${project.title ?? "your video"}”. Your best moment scored ${best}/100.` }
    : undefined;

  const reload = useCallback(async () => {
    if (!project) return;
    const r = await fetch(`/api/projects/${project.id}`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      setPhase({ k: "ready", project: j.project, fresh: false });
    }
  }, [project]);

  useEffect(() => onUnlocked(reload), [onUnlocked, reload]);

  // back from Google sign-in with ?unlock=1: open the paywall over the result
  useEffect(() => {
    if (autoUnlock && project && project.locked) {
      const t = setTimeout(() => unlock(ctx), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoUnlock]);

  async function run(input: { url?: string; text?: string }) {
    lastInput.current = input;
    setInputErr(null);
    const started = Date.now();
    setPhase({ k: "working", started });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    const attempt = async () => {
      const r = await fetch("/api/try", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, j };
    };
    let res = await attempt().catch(() => null);
    if (!res || (res.status >= 500)) res = await attempt().catch(() => null); // retry once
    const elapsed = Date.now() - started;
    if (elapsed < 3200) await new Promise((r) => setTimeout(r, 3200 - elapsed));
    if (!res) return setPhase({ k: "error", message: "We lost the connection. Check your internet and try again." });
    if (!res.ok) {
      if (res.status === 400) { setPhase({ k: "idle" }); setInputErr(res.j.message); return; }
      if (res.status === 429 || res.status === 402) { setPhase({ k: "error", message: res.j.message }); return; }
      return setPhase({ k: "error", message: res.j.message ?? "Something went wrong. Try again." });
    }
    setPhase({ k: "ready", project: res.j.project, fresh: true });
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (mode === "link") {
      if (!url.trim()) return setInputErr("Paste a YouTube link first — or tap an example below.");
      run({ url: url.trim() });
    } else {
      if (text.trim().length < 200) return setInputErr("Paste at least a few paragraphs (200+ characters).");
      run({ text: text.trim() });
    }
  }

  const busy = phase.k === "working";
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => setAnchor(document.getElementById("result-anchor")), []);
  useEffect(() => {
    if (phase.k === "idle") delete document.body.dataset.result;
    else document.body.dataset.result = "1";
  }, [phase.k]);

  const wrap = (node: React.ReactNode) => (anchor ? createPortal(node, anchor) : node);

  return (
    <div className="w-full">
      {/* input */}
      <form onSubmit={submit} className="mx-auto w-full max-w-[640px]" id="try">
        {mode === "link" ? (
          <div className={cn("flex flex-col gap-2 rounded-[28px] border bg-white/[.04] p-2 backdrop-blur-sm transition focus-within:border-lime/60 sm:flex-row sm:items-center sm:rounded-full", inputErr ? "border-hot/70" : "border-line-2")}>
            <label htmlFor="try-url" className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <Link2 className="h-5 w-5 shrink-0 text-mute" />
              <input
                id="try-url" value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" autoComplete="off"
                placeholder="Paste a YouTube link…" aria-label="YouTube link"
                className="h-12 min-w-0 flex-1 bg-transparent text-[17px] text-white placeholder:text-mute-2 outline-none"
              />
            </label>
            <MainButton type="submit" size="md" loading={busy} className="w-full sm:w-auto" glow={!busy}>Find my clips</MainButton>
          </div>
        ) : (
          <div className={cn("rounded-[24px] border bg-white/[.04] p-2", inputErr ? "border-hot/70" : "border-line-2")}>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Paste your script, article or transcript…" aria-label="Script"
              className="w-full resize-none bg-transparent px-4 py-3 text-[16px] text-white placeholder:text-mute-2 outline-none" />
            <MainButton type="submit" size="md" loading={busy} className="w-full" glow={!busy}>Find my clips</MainButton>
          </div>
        )}
        {inputErr && <p className="mt-2 px-4 text-[14px] text-hot" role="alert">{inputErr}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {mode === "link" && EXAMPLES.map((ex) => (
            <button key={ex.label} type="button" disabled={busy} onClick={() => { setUrl(ex.url); run({ url: ex.url }); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-white/[.03] px-3.5 py-2 text-[13.5px] text-white/85 transition hover:border-lime/60 hover:text-white active:scale-95 disabled:opacity-50">
              <ex.icon className="h-4 w-4 text-lime" />{ex.label}
            </button>
          ))}
          <button type="button" onClick={() => { setMode(mode === "link" ? "text" : "link"); setInputErr(null); }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13.5px] text-mute underline-offset-4 hover:text-white hover:underline">
            {mode === "link" ? <><FileText className="h-4 w-4" /> Have a script instead?</> : <><Link2 className="h-4 w-4" /> Use a YouTube link</>}
          </button>
        </div>
      </form>

      {wrap(<>
      <div ref={resultRef} className="scroll-mt-28" />
      <AnimatePresence mode="wait">
        {phase.k === "working" && <Working key="w" />}
        {phase.k === "error" && (
          <motion.div key="e" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-10 max-w-[480px] rounded-[22px] border border-line-2 bg-white/[.03] p-6 text-center">
            <p className="text-[17px] font-semibold text-white">{phase.message}</p>
            <div className="mt-4 flex justify-center gap-2">
              {/free tries|used your/i.test(phase.message) ? (
                <MainButton size="md" onClick={() => unlock()}>Unlock Vidflow</MainButton>
              ) : (
                <button onClick={() => lastInput.current && run(lastInput.current)} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-ink active:scale-95"><RotateCcw className="h-4 w-4" />Try again</button>
              )}
            </div>
          </motion.div>
        )}
        {phase.k === "ready" && project && (
          <motion.div key="r" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 0.8, 0.24, 1] }} className="mx-auto mt-12 max-w-[1040px] text-left">
            <div className="mb-8 text-center">
              <motion.div initial={{ scale: phase.fresh ? 0.6 : 1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12 }} className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-lime text-ink">
                <Check className="h-6 w-6" strokeWidth={3} />
              </motion.div>
              <h2 className="title-xl text-[34px] text-white md:text-[48px]">Your {project.clips.length} clips are ready.</h2>
              <p className="mt-2 text-[15px] text-mute">From “{project.title}” · best moment scored <span className="font-semibold text-white">{best}/100</span></p>
            </div>
            <ResultView
              project={project}
              tier={me?.tier ?? "free"}
              locked={project.locked}
              onLocked={() => unlock(ctx)}
              styleId={style}
              onStyle={setStyle}
              clipActions={(c) => (
                project.locked ? (
                  <MainButton size="md" className="w-full" onClick={() => unlock(ctx)}>Unlock all {project.clips.length} clips</MainButton>
                ) : (
                  <a href={`/clips/${project.id}?clip=${c.id}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-[15px] font-semibold text-ink"><Share2 className="h-4 w-4" />Open in my clips</a>
                )
              )}
            />
            {project.locked && (
              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/85 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
                <button onClick={() => unlock(ctx)} className="flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-lime text-[16px] font-semibold text-ink active:scale-[.97]">
                  <Lock className="h-4 w-4" /> Unlock all {project.clips.length} clips{creator ? ` · ${creator.per_day}/day` : ""}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </>)}
    </div>
  );
}

export function Working() {
  const reduce = useReducedMotion();
  const [pct, setPct] = useState(0);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const s = (t - t0) / 1000;
      // fast at first, then slows down toward 99 % (held until the AI answers)
      const p = Math.min(99, 99 * (1 - Math.exp(-s / 9)));
      setPct(p);
      setStep(Math.min(STEPS.length - 1, Math.floor(p / (99 / STEPS.length))));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto mt-12 grid max-w-[880px] items-center gap-8 text-left md:grid-cols-[1fr_1fr]">
      <div>
        <p className="label text-lime">[ Finding your clips ]</p>
        <p className="mt-3 font-mono text-[64px] font-bold leading-none tracking-[-0.04em] text-white md:text-[84px]" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.floor(pct)}<span className="text-mute">%</span></p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-lime via-lime to-flame transition-[width] duration-200" style={{ width: `${pct}%` }} /></div>
        <ul className="mt-6 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s} className={cn("flex items-center gap-3 text-[15px] transition-colors", i < step ? "text-white" : i === step ? "text-white" : "text-white/35")}>
              <span className={cn("grid h-6 w-6 place-items-center rounded-full border transition-all", i < step ? "border-lime bg-lime text-ink" : i === step ? "border-lime text-lime" : "border-white/20")}>
                {i < step ? <motion.span initial={{ scale: reduce ? 1 : 0 }} animate={{ scale: 1 }}><Check className="h-3.5 w-3.5" strokeWidth={3} /></motion.span> : i === step ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              </span>
              {s}
            </li>
          ))}
        </ul>
        {pct > 95 && <p className="mt-5 text-[13px] text-mute">Long videos take up to a minute. Hang tight — it&apos;s watching every second.</p>}
      </div>
      <Timeline pct={pct} />
    </motion.div>
  );
}

/** Signature element: a waveform timeline with cut points appearing as the AI scores moments. */
function Timeline({ pct }: { pct: number }) {
  const bars = 64;
  const cuts = [0.08, 0.21, 0.33, 0.47, 0.58, 0.69, 0.81, 0.92];
  return (
    <div className="rounded-[22px] border border-line bg-white/[.025] p-5">
      <div className="flex items-center justify-between text-[12px] text-mute"><span className="font-mono">00:00</span><span className="font-mono">scanning…</span></div>
      <div className="relative mt-4 flex h-28 items-center gap-[3px]">
        {Array.from({ length: bars }).map((_, i) => {
          const h = 18 + Math.abs(Math.sin(i * 1.7) * 60 + Math.cos(i * 0.6) * 22);
          const seen = i / bars < pct / 100;
          return <span key={i} className={cn("flex-1 rounded-full transition-colors duration-300", seen ? "bg-white/70" : "bg-white/15")} style={{ height: `${Math.round(Math.min(100, h))}%` }} />;
        })}
        {cuts.map((c, i) => c < pct / 100 && (
          <motion.span key={i} initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} className="absolute top-0 h-full w-[10%] rounded-md border border-lime/80 bg-lime/15" style={{ left: `${c * 100 - 4}%` }} />
        ))}
        <span className="absolute top-0 h-full w-[2px] bg-hot shadow-[0_0_12px_var(--color-hot)]" style={{ left: `${pct}%` }} />
      </div>
      <p className="mt-4 text-[13px] text-mute">{cuts.filter((c) => c < pct / 100).length} hook-worthy moments found so far</p>
    </div>
  );
}
