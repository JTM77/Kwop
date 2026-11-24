"use client";
// One-Click Export: renders a clip in the browser (canvas + MediaRecorder).
// 9:16 center crop, kinetic captions burned in, b-roll cut-ins, hook text. Nothing is uploaded.
import { chunkWords, drawCaption, frameAt, styleById, toWords, type Clip } from "@/lib/captions";

export type RenderOpts = {
  clip: Clip;
  file: File | null; // the creator's own video (null for script clips)
  styleId: string;
  brand?: string | null;
  height: 720 | 1080;
  fps: 30 | 60;
  broll: { url: string; at: number; len: number }[];
  onProgress: (p: number) => void;
  signal?: AbortSignal;
};

export function pickMime() {
  const types = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "video/webm";
}

export function canExport() {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && "captureStream" in HTMLCanvasElement.prototype;
}

function waitEvent(el: HTMLMediaElement, ev: string, ms = 15000) {
  return new Promise<void>((res, rej) => {
    const t = setTimeout(() => rej(new Error(`timeout ${ev}`)), ms);
    el.addEventListener(ev, () => { clearTimeout(t); res(); }, { once: true });
  });
}

function cover(ctx: CanvasRenderingContext2D, v: HTMLVideoElement, W: number, H: number) {
  const vw = v.videoWidth || 16, vh = v.videoHeight || 9;
  const s = Math.max(W / vw, H / vh);
  const dw = vw * s, dh = vh * s;
  ctx.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

export async function renderClip(o: RenderOpts): Promise<{ blob: Blob; ext: string }> {
  const H = o.height, W = Math.round((H * 9) / 16);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const style = styleById(o.styleId);
  const chunks = chunkWords(toWords(o.clip.captions), style.maxWords);
  const len = Math.max(1, o.clip.end - o.clip.start);
  const fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";
  await document.fonts?.ready;

  // b-roll videos
  const brolls = await Promise.all(
    o.broll.map(async (b) => {
      const v = document.createElement("video");
      v.crossOrigin = "anonymous";
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.src = b.url;
      try { await waitEvent(v, "loadeddata", 12000); } catch { return null; }
      return { ...b, v };
    }),
  ).then((x) => x.filter(Boolean) as { url: string; at: number; len: number; v: HTMLVideoElement }[]);

  const stream = canvas.captureStream(o.fps);
  let main: HTMLVideoElement | null = null;
  let audioCtx: AudioContext | null = null;
  let url: string | null = null;
  if (o.file) {
    main = document.createElement("video");
    url = URL.createObjectURL(o.file);
    main.src = url;
    main.playsInline = true;
    main.preload = "auto";
    await waitEvent(main, "loadedmetadata");
    audioCtx = new AudioContext();
    const src = audioCtx.createMediaElementSource(main);
    const dest = audioCtx.createMediaStreamDestination();
    src.connect(dest); // recorded, not played on the speakers
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    main.currentTime = o.clip.start;
    await waitEvent(main, "seeked");
  }

  const mime = pickMime();
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: H >= 1080 ? 8_000_000 : 4_000_000 });
  const parts: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
  const done = new Promise<void>((r) => (rec.onstop = () => r()));

  let t = 0;
  const t0 = performance.now();
  const draw = () => {
    t = main ? main.currentTime - o.clip.start : (performance.now() - t0) / 1000;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    const b = brolls.find((x) => t >= x.at && t < x.at + x.len) ?? (!main ? brolls[Math.floor(t / 4) % Math.max(1, brolls.length)] : undefined);
    if (b) {
      if (b.v.paused) b.v.play().catch(() => {});
      cover(ctx, b.v, W, H);
    } else if (main) {
      cover(ctx, main, W, H);
    } else {
      const g = ctx.createRadialGradient(W * 0.4, H * 0.3, 10, W * 0.5, H * 0.5, H * 0.8);
      g.addColorStop(0, `hsl(${(t * 12) % 360} 90% 50%)`);
      g.addColorStop(1, "#0b0b0d");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    // bottom shade for legibility
    const sh = ctx.createLinearGradient(0, H * 0.5, 0, H);
    sh.addColorStop(0, "rgba(0,0,0,0)");
    sh.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.fillStyle = sh;
    ctx.fillRect(0, H * 0.5, W, H * 0.5);
    // hook
    if (t < 2.2 && o.clip.hook) {
      const fs = Math.round(W * 0.052);
      ctx.font = `700 ${fs}px ${fontFamily}`;
      const tw = Math.min(W * 0.86, ctx.measureText(o.clip.hook).width);
      const x = (W - tw) / 2 - fs * 0.5, y = H * 0.16;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.roundRect?.(x, y, tw + fs, fs * 1.7, fs * 0.35);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(o.clip.hook, W / 2, y + fs * 0.86, W * 0.86);
    }
    drawCaption(ctx, frameAt(chunks, t, style), style, W, H, { brand: o.brand, fontFamily });
    o.onProgress(Math.min(1, t / len));
  };

  rec.start(500);
  if (main) await main.play();
  await new Promise<void>((resolve, reject) => {
    const loop = () => {
      if (o.signal?.aborted) return reject(new DOMException("aborted", "AbortError"));
      draw();
      if (t >= len || (main && main.ended)) return resolve();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }).finally(() => {
    main?.pause();
    brolls.forEach((b) => b.v.pause());
    if (rec.state !== "inactive") rec.stop();
  });
  await done;
  audioCtx?.close().catch(() => {});
  if (url) URL.revokeObjectURL(url);
  stream.getTracks().forEach((tr) => tr.stop());
  return { blob: new Blob(parts, { type: mime.split(";")[0] }), ext: mime.includes("mp4") ? "mp4" : "webm" };
}

// in-memory store of the creator's files for this visit (never uploaded)
const files = new Map<string, File>();
export const localFiles = {
  get: (projectId: string) => files.get(projectId) ?? null,
  set: (projectId: string, f: File) => files.set(projectId, f),
};
