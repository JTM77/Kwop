import "server-only";
import type { Analysis, Caption, Clip } from "@/lib/captions";

// The only place Vidflow talks to an AI model: Google Gemini (newest Flash).
const BASE = "https://generativelanguage.googleapis.com";

function key() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new AiError("missing_key", "The AI key is not set yet.");
  return k;
}

export class AiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

let modelCache: { names: string[]; at: number } | null = null;
const FALLBACK = "gemini-2.5-flash";

/** The newest Gemini Flash models available to this key, newest first (cached 6 h).
 *  The newest one is often overloaded, so callers fall back down this list. */
export async function pickModels(): Promise<string[]> {
  const pinned = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : [];
  if (modelCache && Date.now() - modelCache.at < 6 * 3600_000) return [...new Set([...pinned, ...modelCache.names])];
  try {
    const r = await fetch(`${BASE}/v1beta/models?pageSize=200`, { headers: { "x-goog-api-key": key() } });
    const j = (await r.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const flash = (j.models ?? [])
      .map((m) => ({ id: m.name.replace("models/", ""), gen: m.supportedGenerationMethods ?? [] }))
      .filter((m) => m.gen.includes("generateContent") && /^gemini-\d+(\.\d+)?-flash(-preview)?(-\d{2}-\d{4})?$/.test(m.id))
      .map((m) => ({ ...m, v: parseFloat(m.id.split("-")[1]), preview: m.id.includes("preview") }))
      .sort((a, b) => b.v - a.v || Number(a.preview) - Number(b.preview));
    if (flash[0]) {
      const names = [...new Set([...flash.slice(0, 3).map((m) => m.id), FALLBACK])];
      modelCache = { names, at: Date.now() };
      return [...new Set([...pinned, ...names])];
    }
  } catch (e) {
    console.error("[ai] model list failed", e);
  }
  return [...new Set([...pinned, FALLBACK])];
}

/** Overloaded, rate-limited or briefly down: worth trying another model. */
const BUSY = /high demand|overloaded|try again later|resource.?exhausted|quota|rate limit|HTTP (429|5\d\d)/i;

const CLIP_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    duration: { type: "NUMBER" },
    summary: { type: "STRING" },
    clips: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          hook: { type: "STRING" },
          start: { type: "NUMBER" },
          end: { type: "NUMBER" },
          score: { type: "INTEGER" },
          reason: { type: "STRING" },
          captions: {
            type: "ARRAY",
            items: { type: "OBJECT", properties: { t: { type: "NUMBER" }, e: { type: "NUMBER" }, text: { type: "STRING" } }, required: ["t", "e", "text"] },
          },
          broll: { type: "ARRAY", items: { type: "STRING" } },
          hashtags: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["title", "hook", "start", "end", "score", "reason", "captions", "broll", "hashtags"],
      },
    },
  },
  required: ["title", "duration", "summary", "clips"],
};

const RULES = `You are Vidflow's AI Clip Finder, an expert short-form editor for faceless TikTok, Reels and Shorts channels in the United States.
Find the 10 best standalone moments (fewer only if the source is too short; at least 3). Each clip:
- 20 to 59 seconds long, starts on a strong hook in the first 2 seconds, ends on a complete thought (no cut mid-sentence).
- "title": a scroll-stopping title under 60 characters, in plain American English.
- "hook": the on-screen hook text for the first 2 seconds (under 9 words).
- "score": virality score 0-100 (hook strength, emotion, payoff, standalone clarity). Be honest and spread the scores.
- "reason": one short sentence on why it will hold viewers.
- "captions": the exact spoken words of the clip as caption lines of 2 to 6 words, with start "t" and end "e" in seconds.
- "broll": 3 concrete stock-footage search keywords (nouns a camera can film, like "city night traffic").
- "hashtags": 4 relevant hashtags without the # sign.
Sort clips by score, highest first. Clips must not overlap.`;

type Raw = { title: string; duration: number; summary: string; clips: (Omit<Clip, "id" | "captions"> & { captions: Caption[] })[] };

async function generate(parts: unknown[], timeline: "absolute" | "script"): Promise<Analysis> {
  const models = await pickModels();
  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.5,
      responseMimeType: "application/json",
      responseSchema: CLIP_SCHEMA,
      mediaResolution: "MEDIA_RESOLUTION_LOW",
    },
  };
  let lastErr: unknown;
  // each model gets up to 2 tries; a busy model is skipped right away for the next one
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(`${BASE}/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key() },
          body: JSON.stringify(body),
        });
        const j = await r.json().catch(() => null);
        if (!r.ok) {
          const msg: string = j?.error?.message ?? `HTTP ${r.status}`;
          if (r.status === 429 || r.status >= 500 || BUSY.test(msg)) throw new AiError("busy", `${model}: ${msg}`);
          if (/private|unavailable|not.*(found|accessible)|invalid.*(url|uri)|cannot.*access/i.test(msg)) throw new AiError("bad_source", "We couldn't open this video. Make sure it's public on YouTube.");
          if (/too long|exceeds|token count|context/i.test(msg)) throw new AiError("too_long", "This video is too long for one pass. Try one under 3 hours.");
          throw new AiError("ai_failed", msg);
        }
        const text: string | undefined = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
        if (!text) throw new AiError("ai_failed", "Empty answer from the AI");
        return normalize(JSON.parse(text) as Raw, timeline);
      } catch (e) {
        lastErr = e;
        if (e instanceof AiError && (e.code === "bad_source" || e.code === "too_long" || e.code === "missing_key")) throw e;
        if (e instanceof AiError && e.code === "busy") {
          console.warn("[ai] busy, trying next model:", e.message);
          break;
        }
      }
    }
  }
  if (lastErr instanceof AiError && lastErr.code === "busy") throw new AiError("ai_failed", lastErr.message);
  throw lastErr instanceof AiError ? lastErr : new AiError("ai_failed", String(lastErr));
}

function normalize(raw: Raw, timeline: "absolute" | "script"): Analysis {
  const clips: Clip[] = (raw.clips ?? [])
    .filter((c) => c && c.end > c.start && c.captions?.length)
    .slice(0, 10)
    .map((c, i) => {
      const start = Math.max(0, c.start);
      const end = Math.min(c.end, start + 90);
      // captions arrive in source time; make them relative to the clip start
      const rel = c.captions
        .map((k) => {
          const absolute = k.t >= start - 1 && timeline === "absolute";
          const t = absolute ? k.t - start : k.t;
          const e = absolute ? k.e - start : k.e;
          return { t: Math.max(0, t), e: Math.max(Math.max(0, t) + 0.2, e), text: String(k.text).trim() };
        })
        .filter((k) => k.text && k.t < end - start + 1);
      return {
        id: `c${i + 1}`,
        title: String(c.title).slice(0, 90),
        hook: String(c.hook).slice(0, 90),
        start,
        end,
        score: Math.max(1, Math.min(99, Math.round(c.score))),
        reason: String(c.reason).slice(0, 200),
        captions: rel,
        broll: (c.broll ?? []).slice(0, 4).map(String),
        hashtags: (c.hashtags ?? []).slice(0, 6).map((h) => String(h).replace(/^#/, "")),
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((c, i) => ({ ...c, id: `c${i + 1}` }));
  if (!clips.length) throw new AiError("no_clips", "We couldn't find clear moments in this video. Try another one.");
  return { title: String(raw.title || "Your video").slice(0, 120), duration: Number(raw.duration) || 0, summary: String(raw.summary || "").slice(0, 400), clips };
}

/** Analyze a public YouTube video (Gemini watches it directly). */
export function analyzeYouTube(url: string) {
  return generate(
    [
      { file_data: { file_uri: url, mime_type: "video/*" } },
      { text: `${RULES}\nThe source is a YouTube video. "start"/"end" and caption times are in seconds from the start of the video. "duration" is the video length in seconds. "title" is the video's topic as a short title.` },
    ],
    "absolute",
  );
}

/** Analyze an audio track the user uploaded (from their own video file). */
export async function analyzeAudio(bytes: ArrayBuffer, mime: string, name: string) {
  const k = key();
  // resumable upload to the Gemini Files API
  const start = await fetch(`${BASE}/upload/v1beta/files`, {
    method: "POST",
    headers: {
      "x-goog-api-key": k,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Header-Content-Type": mime,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: name.slice(0, 60) } }),
  });
  const uploadUrl = start.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new AiError("ai_failed", "Upload to the AI failed");
  const up = await fetch(uploadUrl, {
    method: "POST",
    headers: { "X-Goog-Upload-Offset": "0", "X-Goog-Upload-Command": "upload, finalize", "Content-Length": String(bytes.byteLength) },
    body: bytes,
  });
  const fj = await up.json();
  let file = fj.file as { name: string; uri: string; state: string; mimeType: string };
  for (let i = 0; i < 60 && file.state === "PROCESSING"; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const s = await fetch(`${BASE}/v1beta/${file.name}`, { headers: { "x-goog-api-key": k } });
    file = await s.json();
  }
  if (file.state !== "ACTIVE") throw new AiError("ai_failed", "The AI couldn't read this audio");
  return generate(
    [
      { file_data: { file_uri: file.uri, mime_type: file.mimeType } },
      { text: `${RULES}\nThe source is the audio track of the creator's own video. "start"/"end" and caption times are in seconds from the start of the audio. "duration" is the audio length in seconds. "title" is a short title for the topic.` },
    ],
    "absolute",
  );
}

/** Turn a script, article or transcript into faceless clips (b-roll + captions, read at ~2.6 words/s). */
export function analyzeText(text: string) {
  return generate(
    [
      {
        text: `${RULES}\nThe source is a text (script, article, notes or transcript) pasted by a faceless creator. Write each clip as a punchy voice-over script taken from the text (keep its facts, tighten the words). Time captions as if read aloud at 2.6 words per second starting at 0 for each clip; "start" is 0 and "end" is the clip length for every clip. "duration" is the reading time of the whole text in seconds.\n\nTEXT:\n"""${text.slice(0, 60000)}"""`,
      },
    ],
    "script",
  );
}
