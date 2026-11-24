"use client";
import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Lock, Flame, Clock3, Hash } from "lucide-react";
import { Phone } from "@/components/ui/phone";
import { ClipPlayer, type PlayerSource } from "@/components/clip-player";
import { CAPTION_STYLES } from "@/lib/captions";
import type { PublicClip, PublicProject } from "@/lib/types";
import type { Tier } from "@/lib/plans";
import { cn, fmtTime } from "@/lib/utils";

export function sourceFor(p: PublicProject, fileUrl?: string | null): PlayerSource {
  if (p.source_type === "youtube" && p.source_url) {
    const id = new URL(p.source_url).searchParams.get("v");
    if (id) return { kind: "youtube", id };
  }
  if (p.source_type === "file" && fileUrl) return { kind: "file", url: fileUrl };
  return { kind: "script" };
}

export function ScoreBar({ score, className }: { score: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-hot to-flame" initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.9, ease: [0.22, 0.8, 0.24, 1] }} />
      </div>
      <span className="font-mono text-[12px] font-bold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>{score}</span>
    </div>
  );
}

export function canUseStyle(styleId: string, tier: Tier) {
  const s = CAPTION_STYLES.find((x) => x.id === styleId);
  if (!s) return false;
  if (s.minPlan === "starter") return tier !== "free" || styleId === "pop";
  return tier === "creator" || tier === "pro";
}

export function ResultView({
  project, tier, locked, onLocked, styleId, onStyle, brand, fileUrl, broll, clipActions, header, playerOverlay,
}: {
  project: PublicProject;
  tier: Tier;
  locked: boolean;
  onLocked: (why: "clip" | "style" | "action") => void;
  styleId: string;
  onStyle?: (id: string) => void;
  brand?: string | null;
  fileUrl?: string | null;
  broll?: Record<string, { url: string; at: number; len: number }[]>;
  clipActions?: (clip: PublicClip) => ReactNode;
  header?: ReactNode;
  playerOverlay?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const clip = project.clips[active] ?? project.clips[0];
  const source = useMemo(() => sourceFor(project, fileUrl), [project, fileUrl]);
  if (!clip) return null;

  return (
    <div className="grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-12">
      <div className="flex flex-col items-center">
        {/* caption styles: open or locked tabs */}
        <div className="mb-4 flex w-full max-w-[340px] gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] md:max-w-[300px] md:flex-wrap md:justify-center">
          {CAPTION_STYLES.map((s) => {
            const ok = !locked && canUseStyle(s.id, tier) || (locked && s.id === "pop");
            return (
              <button
                key={s.id}
                onClick={() => (ok ? onStyle?.(s.id) : onLocked("style"))}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition active:scale-95",
                  styleId === s.id ? "border-lime bg-lime text-ink" : "border-line-2 text-white/75 hover:border-white/30",
                )}
              >
                {!ok && <Lock className="h-3 w-3" />}
                {s.name}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Phone className="w-[270px] md:w-[300px]">
            <ClipPlayer
              key={`${clip.id}-${project.id}`}
              source={source}
              start={clip.start}
              end={clip.end}
              captions={clip.captions}
              styleId={styleId}
              brand={brand}
              hook={clip.hook}
              broll={broll?.[clip.id]}
            />
          </Phone>
          {playerOverlay}
        </div>
      </div>

      <div className="min-w-0">
        {header}
        {/* active clip details */}
        <div className="rounded-[20px] border border-line bg-white/[.025] p-5">
          <div className="flex items-center gap-2 text-[12px] text-mute">
            <span className="rounded-md bg-lime px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink">CLIP {active + 1}</span>
            <Clock3 className="h-3.5 w-3.5" /> {fmtTime(clip.end - clip.start)}
            {project.source_type !== "text" && <span className="font-mono">· {fmtTime(clip.start)} → {fmtTime(clip.end)}</span>}
          </div>
          <h3 className="mt-3 text-[21px] font-semibold leading-snug tracking-[-0.02em] text-white">{clip.title}</h3>
          <p className="mt-1.5 text-[14.5px] text-mute">Hook: “{clip.hook}”</p>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] text-mute"><Flame className="h-3.5 w-3.5 text-flame" /> Virality score</div>
            <ScoreBar score={clip.score} />
            <p className="mt-2 text-[13.5px] text-white/75">{clip.reason}</p>
          </div>
          {!!clip.hashtags.length && (
            <p className="mt-3 flex flex-wrap gap-1.5 text-[12.5px] text-mute">
              {clip.hashtags.map((h) => <span key={h} className="inline-flex items-center rounded-md bg-white/[.05] px-1.5 py-0.5"><Hash className="h-3 w-3" />{h}</span>)}
            </p>
          )}
          {clipActions && <div className="mt-4 flex flex-wrap gap-2">{clipActions(clip)}</div>}
        </div>

        {/* all clips */}
        <div className="mt-5">
          <p className="label mb-3 text-mute">[ {project.clips.length} clips · best first ]</p>
          <ol className="grid gap-2 sm:grid-cols-2">
            {project.clips.map((c, i) => (
              <li key={c.id}>
                <button
                  onClick={() => (c.locked ? onLocked("clip") : setActive(i))}
                  className={cn(
                    "relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition active:scale-[.98]",
                    i === active ? "border-lime/70 bg-lime/[.06]" : "border-line bg-white/[.02] hover:border-white/20",
                  )}
                >
                  <span className={cn("grid h-14 w-10 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-bold", c.locked ? "bg-white/[.06] text-white/50" : "bg-gradient-to-b from-hot/80 to-flame/80 text-white")}>
                    {c.locked ? <Lock className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[14px] font-medium text-white", c.locked && "select-none blur-[5px]")} aria-hidden={c.locked}>{c.title}</span>
                    <span className="mt-1 flex items-center gap-2 text-[12px] text-mute">
                      <span className="font-mono">{fmtTime(c.end - c.start)}</span>
                      <ScoreBar score={c.score} className="max-w-[120px] flex-1" />
                    </span>
                  </span>
                  {c.locked && <span className="sr-only">Locked clip, score {c.score}</span>}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
