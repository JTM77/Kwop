"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { KineticCaptions } from "@/components/ui/kinetic";
import type { Caption } from "@/lib/captions";
import { cn } from "@/lib/utils";

export type PlayerSource = { kind: "youtube"; id: string } | { kind: "file"; url: string } | { kind: "script" };

type YTPlayer = {
  playVideo(): void; pauseVideo(): void; mute(): void; unMute(): void; seekTo(s: number, a: boolean): void;
  getCurrentTime(): number; getPlayerState(): number; destroy(): void;
};
declare global {
  interface Window { YT?: { Player: new (el: HTMLElement, o: unknown) => YTPlayer; PlayerState: { PLAYING: number; ENDED: number } }; onYouTubeIframeAPIReady?: () => void }
}

let ytLoading: Promise<void> | null = null;
function loadYT() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!ytLoading) {
    ytLoading = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return ytLoading;
}

/**
 * Plays one clip (start → end) in a 9:16 crop with Vidflow's kinetic captions on top.
 * YouTube sources play the public video; file sources play the creator's own file;
 * script sources play b-roll with captions on a clock.
 */
export function ClipPlayer({
  source, start, end, captions, styleId, brand, broll, autoPlay = true, hook, className, onTime,
}: {
  source: PlayerSource; start: number; end: number; captions: Caption[]; styleId: string; brand?: string | null;
  broll?: { url: string; at: number; len: number }[]; autoPlay?: boolean; hook?: string; className?: string; onTime?: (t: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const clock = useRef<{ base: number; at: number; playing: boolean }>({ base: 0, at: 0, playing: autoPlay });
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(source.kind === "script");
  const len = Math.max(1, end - start);

  // YouTube
  useEffect(() => {
    if (source.kind !== "youtube" || !host.current) return;
    let dead = false;
    const el = document.createElement("div");
    host.current.appendChild(el);
    loadYT().then(() => {
      if (dead || !window.YT) return;
      yt.current = new window.YT.Player(el, {
        videoId: source.id,
        width: "100%",
        height: "100%",
        playerVars: { start: Math.floor(start), end: Math.ceil(end), autoplay: autoPlay ? 1 : 0, mute: 1, controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3, fs: 0 },
        events: {
          onReady: (e: { target: YTPlayer }) => { e.target.mute(); if (autoPlay) e.target.playVideo(); setReady(true); },
          onStateChange: (e: { data: number }) => {
            if (e.data === 0) { yt.current?.seekTo(start, true); yt.current?.playVideo(); }
            if (e.data === 1) setPlaying(true);
            if (e.data === 2) setPlaying(false);
          },
        },
      });
    });
    return () => { dead = true; try { yt.current?.destroy(); } catch {} yt.current = null; el.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.kind === "youtube" ? source.id : null, start, end]);

  // file
  useEffect(() => {
    const v = vid.current;
    if (source.kind !== "file" || !v) return;
    v.currentTime = start;
    if (autoPlay) v.play().catch(() => setPlaying(false));
  }, [source, start, autoPlay]);

  // time loop
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      let rel = 0;
      if (source.kind === "youtube" && yt.current?.getCurrentTime) {
        rel = (yt.current.getCurrentTime() || start) - start;
      } else if (source.kind === "file" && vid.current) {
        const v = vid.current;
        if (v.currentTime >= end || v.currentTime < start - 0.5) { v.currentTime = start; }
        rel = v.currentTime - start;
      } else {
        const c = clock.current;
        rel = c.playing ? c.base + (performance.now() - c.at) / 1000 : c.base;
        if (rel >= len) { c.base = 0; c.at = performance.now(); rel = 0; }
      }
      rel = Math.max(0, Math.min(len, rel));
      setT(rel);
      onTime?.(rel);
      raf = requestAnimationFrame(tick);
    };
    clock.current.at = performance.now();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [source.kind, start, end, len, onTime]);

  const toggle = useCallback(() => {
    const next = !playing;
    setPlaying(next);
    if (source.kind === "youtube") { if (next) yt.current?.playVideo(); else yt.current?.pauseVideo(); }
    else if (source.kind === "file") { if (next) vid.current?.play(); else vid.current?.pause(); }
    else {
      const c = clock.current;
      if (next) { c.at = performance.now(); c.playing = true; } else { c.base = c.base + (performance.now() - c.at) / 1000; c.playing = false; }
    }
  }, [playing, source.kind]);

  const toggleMute = useCallback(() => {
    const m = !muted;
    setMuted(m);
    if (source.kind === "youtube") { if (m) yt.current?.mute(); else yt.current?.unMute(); }
    if (vid.current) vid.current.muted = m;
  }, [muted, source.kind]);

  const activeBroll = broll?.find((b) => t >= b.at && t < b.at + b.len);

  return (
    <div className={cn("group/player relative h-full w-full overflow-hidden bg-black", className)}>
      {source.kind === "youtube" && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* 16:9 player scaled to cover the 9:16 frame (center crop) */}
          <div ref={host} className="pointer-events-none aspect-video h-full shrink-0 [&>iframe]:h-full [&>iframe]:w-full" />
        </div>
      )}
      {source.kind === "file" && (
        <video ref={vid} src={source.url} muted={muted} playsInline className="absolute inset-0 h-full w-full object-cover" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      )}
      {source.kind === "script" && <ScriptBackdrop t={t} />}
      {broll?.map((b) => (
        <video
          key={b.url + b.at}
          src={b.url}
          muted
          playsInline
          loop
          autoPlay
          crossOrigin="anonymous"
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-300", activeBroll === b || (source.kind === "script" && broll.length && !activeBroll && b === broll[0]) ? "opacity-100" : "opacity-0")}
        />
      ))}
      {!ready && <div className="skeleton absolute inset-0" />}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
      {hook && t < 2.2 && (
        <div className="pointer-events-none absolute inset-x-4 top-[17%] z-20 text-center">
          <span className="inline-block rounded-lg bg-white px-2.5 py-1.5 text-[15px] font-bold leading-tight text-black shadow-lg">{hook}</span>
        </div>
      )}
      <KineticCaptions captions={captions} time={t} styleId={styleId} brand={brand} />
      {/* progress */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/15">
        <div className="h-full bg-lime" style={{ width: `${(t / len) * 100}%` }} />
      </div>
      <button onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="absolute inset-0 z-10" />
      <div className="absolute bottom-3 right-3 z-20 flex gap-2">
        <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75">
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
      {!playing && ready && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-black/50 backdrop-blur"><Play className="ml-1 h-7 w-7 fill-white text-white" /></span>
        </div>
      )}
    </div>
  );
}

/** Background for script clips before b-roll loads: moving gradient + grain. */
function ScriptBackdrop({ t }: { t: number }) {
  const hue = (t * 12) % 360;
  return (
    <div className="absolute inset-0" style={{ background: `radial-gradient(120% 80% at ${30 + Math.sin(t / 2) * 20}% ${30 + Math.cos(t / 3) * 15}%, hsl(${hue} 90% 55% / .55), transparent 60%), radial-gradient(100% 70% at 80% 90%, hsl(${(hue + 120) % 360} 90% 50% / .45), transparent 60%), #0b0b0d` }} />
  );
}
