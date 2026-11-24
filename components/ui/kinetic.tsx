"use client";
import { useMemo } from "react";
import { chunkWords, frameAt, styleById, toWords, type Caption } from "@/lib/captions";
import { cn } from "@/lib/utils";

/** DOM version of the kinetic captions, driven by a clip-relative time in seconds. */
export function KineticCaptions({ captions, time, styleId, brand, className, size = 1 }: { captions: Caption[]; time: number; styleId: string; brand?: string | null; className?: string; size?: number }) {
  const style = styleById(styleId);
  const chunks = useMemo(() => chunkWords(toWords(captions), style.maxWords), [captions, style.maxWords]);
  const f = frameAt(chunks, time, style);
  if (!f) return null;
  const fs = (style.maxWords <= 3 ? 26 : 20) * size;
  const active = brand || style.active;
  return (
    <div className={cn("pointer-events-none absolute inset-x-3 top-[62%] z-20 flex flex-wrap items-center justify-center gap-x-[0.28em] gap-y-1 text-center leading-[1.1]", className)} style={{ fontFamily: style.font, fontWeight: style.weight, fontSize: fs }}>
      {f.words.map((w, i) => {
        if (style.mode === "type" && i > f.active) return null;
        const isA = i === f.active;
        const bg = style.bg && (style.mode === "type" || isA) ? (style.mode === "karaoke" ? brand || style.bg : style.bg) : undefined;
        return (
          <span
            key={`${f.chunkStart}-${i}`}
            className={cn("inline-block rounded-[0.18em] px-[0.12em] transition-transform duration-150", isA && style.mode === "chunk" && "scale-[1.08]")}
            style={{
              color: isA ? active : style.mode === "karaoke" && i < f.active ? "#fff" : style.fill,
              background: bg,
              WebkitTextStroke: style.strokeWidth ? `${(style.strokeWidth * fs) / 2.2}px ${style.stroke}` : undefined,
              paintOrder: "stroke fill",
              textShadow: style.glow ? `0 0 ${fs * 0.5}px ${style.glow}` : "0 2px 8px rgba(0,0,0,.35)",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}
