// Shared kinetic-caption engine: used by the live preview (DOM) and the export renderer (canvas).

export type Caption = { t: number; e: number; text: string }; // seconds, relative to the clip start

export type Clip = {
  id: string;
  title: string;
  hook: string;
  start: number; // seconds in the source video
  end: number;
  score: number; // 0..100
  reason: string;
  captions: Caption[];
  broll: string[]; // stock-footage keywords
  hashtags: string[];
};

export type Analysis = {
  title: string;
  duration: number;
  summary: string;
  clips: Clip[];
};

export type CaptionStyleId = "pop" | "karaoke" | "neon" | "typewriter" | "minimal" | "beast";

export type CaptionStyle = {
  id: CaptionStyleId;
  name: string;
  minPlan: "starter" | "creator";
  font: string; // css font-family fragment
  weight: number;
  upper: boolean;
  fill: string;
  active: string;
  stroke: string;
  strokeWidth: number; // relative to font size
  glow?: string;
  bg?: string; // box behind the active word
  maxWords: number;
  mode: "chunk" | "karaoke" | "type";
};

export const CAPTION_STYLES: CaptionStyle[] = [
  { id: "pop", name: "Bold Pop", minPlan: "starter", font: "var(--font-grotesk), sans-serif", weight: 800, upper: true, fill: "#ffffff", active: "#c8ff3d", stroke: "#000000", strokeWidth: 0.16, maxWords: 3, mode: "chunk" },
  { id: "minimal", name: "Minimal", minPlan: "starter", font: "var(--font-grotesk), sans-serif", weight: 600, upper: false, fill: "#ffffff", active: "#ffffff", stroke: "rgba(0,0,0,.55)", strokeWidth: 0.08, maxWords: 6, mode: "chunk" },
  { id: "karaoke", name: "Karaoke", minPlan: "creator", font: "var(--font-grotesk), sans-serif", weight: 800, upper: true, fill: "rgba(255,255,255,.55)", active: "#ffffff", stroke: "#000000", strokeWidth: 0.14, bg: "#ff3d7f", maxWords: 4, mode: "karaoke" },
  { id: "neon", name: "Neon", minPlan: "creator", font: "var(--font-grotesk), sans-serif", weight: 700, upper: true, fill: "#e9fffb", active: "#3dfff0", stroke: "rgba(0,0,0,.4)", strokeWidth: 0.06, glow: "#3dfff0", maxWords: 3, mode: "chunk" },
  { id: "typewriter", name: "Typewriter", minPlan: "creator", font: "var(--font-jet), monospace", weight: 700, upper: false, fill: "#ffffff", active: "#ffffff", stroke: "#000000", strokeWidth: 0.12, bg: "rgba(0,0,0,.72)", maxWords: 5, mode: "type" },
  { id: "beast", name: "Beast", minPlan: "creator", font: "var(--font-grotesk), sans-serif", weight: 900, upper: true, fill: "#ffe600", active: "#ff3d3d", stroke: "#000000", strokeWidth: 0.2, maxWords: 2, mode: "chunk" },
];

export function styleById(id: string | null | undefined): CaptionStyle {
  return CAPTION_STYLES.find((s) => s.id === id) ?? CAPTION_STYLES[0];
}

export type Word = { w: string; t: number; e: number; line: number };

/** Split caption lines into timed words (time spread by word length). */
export function toWords(captions: Caption[]): Word[] {
  const out: Word[] = [];
  captions.forEach((c, line) => {
    const parts = c.text.split(/\s+/).filter(Boolean);
    if (!parts.length) return;
    const dur = Math.max(0.2, c.e - c.t);
    const total = parts.reduce((a, p) => a + p.length + 2, 0);
    let cur = c.t;
    for (const p of parts) {
      const d = (dur * (p.length + 2)) / total;
      out.push({ w: p, t: cur, e: cur + d, line });
      cur += d;
    }
  });
  return out;
}

/** Groups of words shown together on screen. */
export function chunkWords(words: Word[], maxWords: number): Word[][] {
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = words[i - 1];
    const gap = prev ? w.t - prev.e : 0;
    const sentenceEnd = prev && /[.!?]$/.test(prev.w);
    if (cur.length && (cur.length >= maxWords || gap > 0.6 || sentenceEnd || (prev && prev.line !== w.line && cur.length >= 2))) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

export type Frame = { words: string[]; active: number; progress: number; chunkStart: number } | null;

/** What to show at time `time` (seconds from clip start). */
export function frameAt(chunks: Word[][], time: number, style: CaptionStyle): Frame {
  for (const ch of chunks) {
    const s = ch[0].t;
    const e = ch[ch.length - 1].e + 0.15;
    if (time >= s && time < e) {
      let active = ch.findIndex((w) => time >= w.t && time < w.e);
      if (active < 0) active = ch.length - 1;
      const words = ch.map((w) => (style.upper ? w.w.toUpperCase() : w.w));
      return { words, active, progress: (time - s) / Math.max(0.01, e - s), chunkStart: s };
    }
  }
  return null;
}

/** Canvas drawing of one caption frame (export renderer). */
export function drawCaption(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  style: CaptionStyle,
  W: number,
  H: number,
  opts: { brand?: string | null; fontFamily: string } ,
) {
  if (!frame) return;
  const size = Math.round(W * (style.maxWords <= 3 ? 0.085 : 0.066));
  ctx.save();
  ctx.font = `${style.weight} ${size}px ${opts.fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const space = size * 0.28;
  const maxW = W * 0.84;
  // layout in lines
  const lines: { idx: number; w: string; width: number }[][] = [[]];
  let lineW = 0;
  frame.words.forEach((w, idx) => {
    const width = ctx.measureText(w).width;
    if (lineW + width > maxW && lines[lines.length - 1].length) {
      lines.push([]);
      lineW = 0;
    }
    lines[lines.length - 1].push({ idx, w, width });
    lineW += width + space;
  });
  const lh = size * 1.18;
  const y0 = H * 0.68 - ((lines.length - 1) * lh) / 2;
  const pop = Math.min(1, (frame.progress * 8));
  const active = opts.brand || style.active;
  lines.forEach((line, li) => {
    const total = line.reduce((a, x) => a + x.width, 0) + space * (line.length - 1);
    let x = (W - total) / 2;
    const y = y0 + li * lh;
    for (const item of line) {
      const isActive = item.idx === frame.active;
      if (style.mode === "type" && item.idx > frame.active) break;
      const scale = isActive && style.mode === "chunk" ? 1 + 0.08 * (1 - Math.abs(pop - 0.5) * 2) : 1;
      ctx.save();
      ctx.translate(x + item.width / 2, y);
      ctx.scale(scale, scale);
      if (style.bg && (style.mode === "type" || isActive)) {
        ctx.fillStyle = style.mode === "karaoke" ? (opts.brand || style.bg) : style.bg;
        const padX = size * 0.18;
        const r = size * 0.18;
        roundRect(ctx, -item.width / 2 - padX, -size * 0.62, item.width + padX * 2, size * 1.2, r);
        ctx.fill();
      }
      if (style.glow) {
        ctx.shadowColor = style.glow;
        ctx.shadowBlur = size * 0.5;
      }
      if (style.strokeWidth > 0) {
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = size * style.strokeWidth;
        ctx.strokeText(item.w, -item.width / 2, 0);
      }
      ctx.fillStyle = isActive ? active : style.mode === "karaoke" && item.idx < frame.active ? "#ffffff" : style.fill;
      ctx.fillText(item.w, -item.width / 2, 0);
      ctx.restore();
      x += item.width + space;
    }
  });
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
