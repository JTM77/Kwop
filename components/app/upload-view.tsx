"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Film, Link2, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { PageTitle } from "@/components/app/shell";
import { LinkFinder } from "@/components/app/link-finder";
import { useUnlock } from "@/components/paywall/unlock-provider";
import { Working } from "@/components/try/try-flow";
import { supabaseBrowser } from "@/lib/supabase/client";
import { extractAudio, videoDuration } from "@/lib/audio";
import { localFiles } from "@/lib/render";
import { QUOTAS } from "@/lib/plans";
import { cn, fmtTime } from "@/lib/utils";

type Stage = { k: "idle" } | { k: "prep"; label: string; pct: number } | { k: "ai" } | { k: "error"; msg: string };

export function UploadView() {
  const router = useRouter();
  const { me, unlock, upgrade } = useUnlock();
  const [tab, setTab] = useState<"link" | "file">("link");
  const [stage, setStage] = useState<Stage>({ k: "idle" });
  const [drag, setDrag] = useState(false);
  const q = QUOTAS[me?.tier ?? "free"];

  async function handle(file: File) {
    if (!me?.paid) return unlock({ title: "Upload your own videos", line: "Pick a plan to turn your own files into clips." });
    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) return setStage({ k: "error", msg: "That's not a video file. Try an .mp4, .mov or .webm." });
    try {
      setStage({ k: "prep", label: "Reading your video", pct: 0 });
      const duration = await videoDuration(file).catch(() => 0);
      if (!duration) return setStage({ k: "error", msg: "We couldn't read this file. Try an .mp4 or .mov." });
      if (duration > q.maxMinutes * 60 + 60) { setStage({ k: "idle" }); return upgrade(`Videos up to ${q.maxMinutes} min on your plan`); }
      setStage({ k: "prep", label: "Pulling the audio (on your device)", pct: 0 });
      const { blob, ext } = await extractAudio(file, (p) => setStage({ k: "prep", label: "Pulling the audio (on your device)", pct: p }));
      setStage({ k: "prep", label: "Sending the audio to the AI", pct: 1 });
      const s = await fetch("/api/upload/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ext }) });
      if (!s.ok) throw new Error("sign");
      const { path, token } = await s.json();
      const up = await supabaseBrowser().storage.from("audio").uploadToSignedUrl(path, token, blob, { contentType: blob.type });
      if (up.error) throw up.error;
      setStage({ k: "ai" });
      const t0 = Date.now();
      const r = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, fileName: file.name, duration }) });
      const j = await r.json().catch(() => ({}));
      if (Date.now() - t0 < 6000) await new Promise((x) => setTimeout(x, 6000 - (Date.now() - t0)));
      if (!r.ok) {
        if (j.error === "quota") { setStage({ k: "idle" }); return upgrade("Monthly videos used"); }
        return setStage({ k: "error", msg: j.message ?? "The AI couldn't read this file. Try again." });
      }
      localFiles.set(j.project.id, file);
      router.push(`/clips/${j.project.id}?new=1`);
    } catch (e) {
      console.error(e);
      setStage({ k: "error", msg: "The upload didn't go through. Check your connection and try again." });
    }
  }

  if (stage.k === "ai") return <Working />;

  return (
    <div>
      <PageTitle title="New video" sub="Turn one long video into up to 10 clips." />
      <div className="mb-6 inline-flex rounded-full border border-line-2 bg-white/[.03] p-1">
        {([["link", "YouTube link", Link2], ["file", "Video file", Film]] as const).map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition", tab === k ? "bg-white text-ink" : "text-white/70 hover:text-white")}>
            <I className="h-4 w-4" />{l}{k === "file" && !me?.paid && <Lock className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>

      {tab === "link" ? (
        <div>
          <LinkFinder />
          <ul className="mt-8 grid gap-3 text-[14px] text-white/75 sm:grid-cols-3">
            {["Public YouTube videos and podcasts", `Up to ${q.maxMinutes || 45} minutes on your plan`, "Up to 10 clips, best first"].map((x) => <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-lime" />{x}</li>)}
          </ul>
        </div>
      ) : stage.k === "prep" ? (
        <div className="max-w-[560px] rounded-[22px] border border-line bg-white/[.025] p-6">
          <p className="flex items-center gap-2 text-[16px] font-semibold text-white"><Loader2 className="h-4 w-4 animate-spin text-lime" />{stage.label}…</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-lime transition-[width]" style={{ width: `${Math.max(4, stage.pct * 100)}%` }} /></div>
          <p className="mt-3 text-[13px] text-mute">Big files take a minute. Keep this tab open.</p>
        </div>
      ) : (
        <div className="max-w-[680px]">
          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handle(f); }}
            className={cn("grid cursor-pointer place-items-center rounded-[24px] border-2 border-dashed px-6 py-16 text-center transition", drag ? "border-lime bg-lime/[.05]" : "border-line-2 hover:border-white/30")}
          >
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-lime text-ink"><Film className="h-7 w-7" /></span>
            <span className="mt-4 text-[19px] font-semibold text-white">Drop your long video here</span>
            <span className="mt-1 text-[14px] text-mute">or tap to choose · .mp4 .mov .webm · up to {q.maxMinutes ? fmtTime(q.maxMinutes * 60) : "45:00"}</span>
            <input type="file" accept="video/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
          </label>
          {stage.k === "error" && <p className="mt-3 text-[14px] text-hot" role="alert">{stage.msg}</p>}
          <p className="mt-4 flex items-start gap-2 text-[13.5px] text-mute"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lime" />Your video stays on your device. Vidflow only sends a small audio track to the AI to find the moments, then deletes it.</p>
        </div>
      )}
    </div>
  );
}
