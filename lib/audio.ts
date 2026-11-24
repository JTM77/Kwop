"use client";
// Extracts a small speech-quality audio track from the creator's video, in the browser (ffmpeg.wasm).
// Only this audio is uploaded for the AI; the video never leaves the device.
import { FFmpeg } from "@ffmpeg/ffmpeg";
import type { FFFSType } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ff: FFmpeg | null = null;

async function load() {
  if (ff?.loaded) return ff;
  ff = new FFmpeg();
  const base = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
  await ff.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
  });
  return ff;
}

export async function extractAudio(file: File, onProgress: (p: number) => void): Promise<{ blob: Blob; ext: "ogg" | "mp3" }> {
  const f = await load();
  const handler = ({ progress }: { progress: number }) => onProgress(Math.max(0, Math.min(1, progress)));
  f.on("progress", handler);
  try {
    await f.createDir("/in").catch(() => {});
    await f.mount("WORKERFS" as FFFSType, { files: [file] }, "/in");
    const input = `/in/${file.name}`;
    let ext: "ogg" | "mp3" = "ogg";
    let code = await f.exec(["-i", input, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libopus", "-b:a", "16k", "out.ogg"]);
    if (code !== 0) {
      ext = "mp3";
      code = await f.exec(["-i", input, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libmp3lame", "-b:a", "24k", "out.mp3"]);
    }
    if (code !== 0) throw new Error("ffmpeg failed");
    const data = (await f.readFile(`out.${ext}`)) as Uint8Array;
    await f.deleteFile(`out.${ext}`).catch(() => {});
    await f.unmount("/in").catch(() => {});
    return { blob: new Blob([data.slice().buffer], { type: ext === "ogg" ? "audio/ogg" : "audio/mpeg" }), ext };
  } finally {
    f.off("progress", handler);
  }
}

export function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    const url = URL.createObjectURL(file);
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unreadable")); };
    v.src = url;
  });
}
