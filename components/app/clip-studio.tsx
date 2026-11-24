"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Film, Lock, Pencil, Share2, Trash2, Upload, Clapperboard, Loader2 } from "lucide-react";
import { ResultView } from "@/components/result-view";
import { ErrorState } from "@/components/app/shell";
import { useUnlock } from "@/components/paywall/unlock-provider";
import { Sheet } from "@/components/ui/sheet";
import { MainButton, GhostButton } from "@/components/ui/main-button";
import { QUOTAS } from "@/lib/plans";
import { canExport, localFiles, renderClip } from "@/lib/render";
import type { PublicClip, PublicProject } from "@/lib/types";
import { cn } from "@/lib/utils";

type Broll = Record<string, { url: string; at: number; len: number }[]>;

function event(type: string, detail?: string) {
  fetch("/api/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, detail }) }).catch(() => {});
}

export function ClipStudio({ id }: { id: string }) {
  const router = useRouter();
  const { me, unlock, upgrade, plans, onUnlocked } = useUnlock();
  const [p, setP] = useState<PublicProject | null>(null);
  const [err, setErr] = useState<"nf" | "net" | null>(null);
  const [style, setStyle] = useState("pop");
  const [brand, setBrand] = useState<string | null>(null);
  const [brollOn, setBrollOn] = useState(false);
  const [broll, setBroll] = useState<Broll>({});
  const [brollBusy, setBrollBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const [exporting, setExporting] = useState<PublicClip | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const tier = me?.tier ?? "free";
  const q = QUOTAS[tier];

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      if (r.status === 404) return setErr("nf");
      if (!r.ok) throw new Error();
      const j = await r.json();
      setP(j.project);
      setStyle(j.project.caption_style ?? "pop");
    } catch {
      setErr("net");
    }
  }, [id]);

  useEffect(() => { load(); setFile(localFiles.get(id)); }, [load, id]);
  useEffect(() => onUnlocked(load), [onUnlocked, load]);
  useEffect(() => {
    if (tier !== "pro") return;
    fetch("/api/account").then((r) => r.json()).then((j) => setBrand(j.profile?.brand_color ?? null)).catch(() => {});
  }, [tier]);
  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2200); return () => clearTimeout(t); } }, [toast]);

  // Smart B-Roll: match stock footage to each clip's keywords
  useEffect(() => {
    if (!brollOn || !p || p.locked) return;
    let dead = false;
    (async () => {
      setBrollBusy(true);
      const out: Broll = {};
      for (const c of p.clips) {
        const list: { url: string; at: number; len: number }[] = [];
        const len = c.end - c.start;
        const slots = p.source_type === "text" ? Math.min(c.broll.length, Math.max(1, Math.ceil(len / 5))) : Math.min(2, c.broll.length);
        for (let i = 0; i < slots; i++) {
          const kw = c.broll[i];
          if (!kw) continue;
          const r = await fetch(`/api/broll?q=${encodeURIComponent(kw)}`).then((x) => x.json()).catch(() => ({ results: [] }));
          const hit = r.results?.[0];
          if (!hit) continue;
          const at = p.source_type === "text" ? (len / slots) * i : len * (0.28 + 0.4 * i);
          list.push({ url: hit.url, at, len: p.source_type === "text" ? len / slots : 2.4 });
        }
        out[c.id] = list;
        if (!dead) setBroll({ ...out });
      }
      if (!dead) setBrollBusy(false);
      event("feature_used", "Smart B-Roll");
    })();
    return () => { dead = true; };
  }, [brollOn, p]);

  async function changeStyle(s: string) {
    setStyle(s);
    event("feature_used", "Kinetic Captions");
    if (p && !p.locked) fetch(`/api/projects/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption_style: s }) }).catch(() => {});
  }

  async function share(c: PublicClip) {
    const url = `${location.origin}/share/${p!.id}/${c.id}`;
    try {
      if (navigator.share) await navigator.share({ title: c.title, text: `${c.title} — made with Vidflow`, url });
      else { await navigator.clipboard.writeText(url); setToast("Share link copied"); }
    } catch { /* cancelled */ }
  }

  async function copyCaption(c: PublicClip) {
    const text = `${c.title}\n\n${c.hashtags.map((h) => `#${h}`).join(" ")}`;
    await navigator.clipboard.writeText(text).catch(() => {});
    setToast("Caption + hashtags copied");
  }

  async function rename(title: string) {
    setRenaming(false);
    if (!p || !title.trim() || title === p.title) return;
    setP({ ...p, title });
    await fetch(`/api/projects/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
  }

  async function del() {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/clips");
  }

  if (err === "nf") return <ErrorState text="This video isn't in your account anymore." onRetry={() => router.push("/clips")} />;
  if (err === "net") return <ErrorState text="We couldn't load your clips." onRetry={load} />;
  if (!p) return <StudioSkeleton />;
  if (p.status === "failed") return <ErrorState text="This video didn't work. Try another link or upload the file." onRetry={() => router.push("/upload")} />;

  const creator = plans.find((x) => /creator/i.test(x.name));
  const ctx = { title: `Your ${p.clips.length} clips are ready.`, line: `From “${p.title}”. Your best moment scored ${p.bestScore}/100.` };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input autoFocus defaultValue={p.title ?? ""} onBlur={(e) => rename(e.target.value)} onKeyDown={(e) => e.key === "Enter" && rename((e.target as HTMLInputElement).value)} className="w-full rounded-xl border border-line-2 bg-white/[.04] px-3 py-2 text-[24px] font-bold tracking-[-0.03em] text-white outline-none focus:border-lime" aria-label="Video title" />
          ) : (
            <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.035em] text-white md:text-[36px]">{p.title}</h1>
          )}
          <p className="mt-1.5 text-[14.5px] text-mute">{p.clips.length} clips · best moment {p.bestScore}/100 {p.summary ? `· ${p.summary.slice(0, 90)}${p.summary.length > 90 ? "…" : ""}` : ""}</p>
        </div>
        {!p.locked && (
          <div className="flex gap-2">
            <GhostButton onClick={() => setRenaming(true)} aria-label="Rename"><Pencil className="h-4 w-4" /><span className="hidden sm:inline">Rename</span></GhostButton>
            <GhostButton onClick={() => setConfirmDel(true)} aria-label="Delete"><Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Delete</span></GhostButton>
          </div>
        )}
      </div>

      {/* tools bar */}
      {!p.locked && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => (q.broll ? setBrollOn(!brollOn) : upgrade("Smart B-Roll"))}
            className={cn("inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition", brollOn ? "border-lime bg-lime/10 text-white" : "border-line-2 text-white/80 hover:border-white/30")}
          >
            {!q.broll ? <Lock className="h-4 w-4" /> : brollBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4 text-lime" />}
            Smart B-Roll {brollOn ? "on" : "off"}
            {!q.broll && <span className="text-[12px] text-mute">· Creator</span>}
          </button>
          {p.source_type !== "text" && (
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line-2 px-4 text-[14px] font-medium text-white/80 transition hover:border-white/30">
              <Upload className="h-4 w-4" />{file ? <>Using <span className="max-w-[140px] truncate">{file.name}</span></> : p.source_type === "file" ? "Re-add your video file" : "Add your video file"}
              <input type="file" accept="video/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) { localFiles.set(p.id, f); setFile(f); } }} />
            </label>
          )}
        </div>
      )}

      <ResultView
        project={p}
        tier={tier}
        locked={p.locked}
        onLocked={(why) => (p.locked ? unlock(ctx) : why === "style" ? upgrade("All 6 caption styles") : unlock(ctx))}
        styleId={style}
        onStyle={changeStyle}
        brand={brand}
        fileUrl={fileUrl}
        broll={brollOn ? broll : undefined}
        clipActions={(c) =>
          p.locked ? (
            <MainButton size="md" className="w-full" onClick={() => unlock(ctx)}>Unlock all {p.clips.length} clips</MainButton>
          ) : (
            <>
              <button onClick={() => setExporting(c)} className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-[15px] font-semibold text-ink active:scale-95"><Download className="h-4 w-4" />Download</button>
              <GhostButton onClick={() => share(c)}><Share2 className="h-4 w-4" />Share</GhostButton>
              <GhostButton onClick={() => copyCaption(c)}><Copy className="h-4 w-4" />Caption</GhostButton>
            </>
          )
        }
      />

      {p.locked && (
        <div className="fixed inset-x-0 bottom-16 z-30 px-4 pb-3 md:bottom-0 md:left-[248px] md:px-10 md:pb-6">
          <button onClick={() => unlock(ctx)} className="mx-auto flex h-[54px] w-full max-w-[560px] items-center justify-center gap-2 rounded-full bg-lime text-[16px] font-semibold text-ink shadow-[0_10px_40px_rgba(200,255,61,.3)] active:scale-[.97]">
            <Lock className="h-4 w-4" /> Unlock all {p.clips.length} clips{creator ? ` · ${creator.per_day}/day` : ""}
          </button>
        </div>
      )}

      <ExportSheet
        clip={exporting}
        project={p}
        file={file}
        onFile={(f) => { localFiles.set(p.id, f); setFile(f); }}
        styleId={style}
        brand={brand}
        broll={brollOn && exporting ? broll[exporting.id] ?? [] : []}
        height={q.exportHeight}
        fps={q.fps}
        onClose={() => setExporting(null)}
      />

      <Sheet open={confirmDel} onClose={() => setConfirmDel(false)} label="Delete video" width={420}>
        <div className="px-6 pb-8 pt-14">
          <h2 className="text-[22px] font-semibold text-white">Delete “{p.title}”?</h2>
          <p className="mt-2 text-[15px] text-mute">Its {p.clips.length} clips are deleted too. This can&apos;t be undone.</p>
          <div className="mt-6 flex gap-2">
            <GhostButton className="flex-1" onClick={() => setConfirmDel(false)}>Keep it</GhostButton>
            <button onClick={del} className="h-11 flex-1 rounded-full bg-hot text-[15px] font-semibold text-white active:scale-95">Delete</button>
          </div>
        </div>
      </Sheet>

      {toast && <div className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-[14px] font-medium text-ink shadow-xl md:bottom-8"><Check className="mr-1.5 inline h-4 w-4" />{toast}</div>}
    </div>
  );
}

function StudioSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-[auto_1fr]">
      <div className="skeleton mx-auto aspect-[9/19] w-[270px] rounded-[44px]" />
      <div className="space-y-3"><div className="skeleton h-10 w-3/4 rounded-xl" /><div className="skeleton h-40 rounded-[20px]" /><div className="skeleton h-20 rounded-2xl" /><div className="skeleton h-20 rounded-2xl" /></div>
    </div>
  );
}

function ExportSheet({ clip, project, file, onFile, styleId, brand, broll, height, fps, onClose }: {
  clip: PublicClip | null; project: PublicProject; file: File | null; onFile: (f: File) => void; styleId: string; brand: string | null;
  broll: { url: string; at: number; len: number }[]; height: 720 | 1080; fps: 30 | 60; onClose: () => void;
}) {
  const [state, setState] = useState<"idle" | "rendering" | "done" | "error">("idle");
  const [pct, setPct] = useState(0);
  const [out, setOut] = useState<{ url: string; name: string } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const needsFile = project.source_type !== "text" && !file;

  useEffect(() => {
    if (!clip) { abort.current?.abort(); setState("idle"); setPct(0); if (out) URL.revokeObjectURL(out.url); setOut(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip]);

  async function start() {
    if (!clip) return;
    if (!canExport()) return setState("error");
    setState("rendering");
    abort.current = new AbortController();
    try {
      const { blob, ext } = await renderClip({ clip, file, styleId, brand, height, fps, broll, onProgress: setPct, signal: abort.current.signal });
      const name = `${clip.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 50) || "vidflow-clip"}.${ext}`;
      setOut({ url: URL.createObjectURL(blob), name });
      setState("done");
      event("feature_used", "One-Click Export");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setState("error");
    }
  }

  return (
    <Sheet open={!!clip} onClose={onClose} label="Download clip" width={460}>
      <div className="px-6 pb-8 pt-14 md:px-8">
        <p className="label text-lime">[ One-click export ]</p>
        <h2 className="mt-2 text-[22px] font-semibold leading-snug tracking-[-0.02em] text-white">{clip?.title}</h2>
        <p className="mt-1 text-[14px] text-mute">Vertical 9:16 · {height === 1080 ? "1080×1920" : "720×1280"} · {fps}fps · kinetic captions{broll.length ? " · b-roll" : ""}</p>

        {needsFile ? (
          <div className="mt-6">
            <label className="grid cursor-pointer place-items-center rounded-[20px] border-2 border-dashed border-line-2 px-6 py-10 text-center transition hover:border-lime/60">
              <Film className="h-8 w-8 text-lime" />
              <span className="mt-3 text-[16px] font-semibold text-white">Add your video file</span>
              <span className="mt-1 max-w-[300px] text-[13.5px] text-mute">{project.source_type === "youtube" ? "Vidflow never downloads from YouTube. Drop your own copy of this video and we cut it right here, on your device." : "Drop the same file again — it stays on your device."}</span>
              <input type="file" accept="video/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
            </label>
          </div>
        ) : state === "idle" ? (
          <div className="mt-6">
            <MainButton size="md" className="w-full" onClick={start}>Render & download</MainButton>
            <p className="mt-3 text-center text-[12.5px] text-mute">Renders on your device in about the length of the clip. Keep this tab open.</p>
          </div>
        ) : state === "rendering" ? (
          <div className="mt-6">
            <div className="flex items-center justify-between text-[14px] text-white"><span>Rendering…</span><span className="font-mono">{Math.round(pct * 100)}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-lime transition-[width]" style={{ width: `${pct * 100}%` }} /></div>
            <p className="mt-3 text-[12.5px] text-mute">Keep this tab open until it&apos;s done.</p>
          </div>
        ) : state === "done" && out ? (
          <div className="mt-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime text-ink"><Check className="h-7 w-7" strokeWidth={3} /></div>
            <p className="mt-3 text-[17px] font-semibold text-white">Your clip is ready to post</p>
            <a href={out.url} download={out.name} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime text-[16px] font-semibold text-ink active:scale-[.97]"><Download className="h-5 w-5" />Save {out.name.split(".").pop()?.toUpperCase()}</a>
          </div>
        ) : (
          <div className="mt-6 text-center">
            <p className="text-[16px] text-white">This browser couldn&apos;t render the clip.</p>
            <p className="mt-1 text-[14px] text-mute">Try Chrome or Edge on a computer, then try again.</p>
            <GhostButton className="mt-4" onClick={() => setState("idle")}>Try again</GhostButton>
          </div>
        )}
      </div>
    </Sheet>
  );
}
