import "server-only";
import type { Analysis } from "@/lib/captions";
import type { PublicClip, PublicProject } from "@/lib/types";

export type ProjectRow = {
  id: string;
  user_id: string | null;
  try_id: string | null;
  source_type: "youtube" | "file" | "text";
  source_url: string | null;
  file_name: string | null;
  title: string | null;
  duration: number | null;
  status: "working" | "ready" | "failed";
  error: string | null;
  analysis: Analysis | null;
  caption_style: string;
  created_at: string;
};

export type { PublicClip, PublicProject } from "@/lib/types";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";
function scramble(s: string, seed: number) {
  let x = seed || 7;
  return s.replace(/[A-Za-z0-9]/g, (ch) => {
    x = (x * 9301 + 49297) % 233280;
    const c = LETTERS[x % 26];
    return ch === ch.toUpperCase() && /[A-Z]/.test(ch) ? c.toUpperCase() : c;
  });
}

/** What the browser may see. Locked clips never leave the server in clear. */
export function toPublic(p: ProjectRow, unlocked: boolean): PublicProject {
  const clips = (p.analysis?.clips ?? []).map((c, i): PublicClip => {
    if (unlocked || i === 0) return { ...c, locked: false };
    return {
      id: c.id,
      title: scramble(c.title, i * 31),
      hook: scramble(c.hook, i * 17),
      start: 0,
      end: c.end - c.start,
      score: c.score,
      reason: scramble(c.reason, i * 13),
      captions: [],
      broll: [],
      hashtags: [],
      locked: true,
    };
  });
  return {
    id: p.id,
    source_type: p.source_type,
    source_url: p.source_url,
    file_name: p.file_name,
    title: p.title ?? p.analysis?.title ?? null,
    duration: p.duration,
    status: p.status,
    error: p.error,
    caption_style: p.caption_style,
    created_at: p.created_at,
    locked: !unlocked,
    summary: p.analysis?.summary ?? null,
    clips,
    bestScore: clips.length ? Math.max(...clips.map((c) => c.score)) : null,
  };
}

export function youtubeId(input: string): string | null {
  const s = input.trim();
  const m =
    s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/) ??
    (/^[A-Za-z0-9_-]{11}$/.test(s) ? [s, s] : null);
  return m ? m[1] : null;
}
