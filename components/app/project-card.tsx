"use client";
import Link from "next/link";
import { FileText, Film, Lock, PlaySquare as Youtube, AlertCircle, Loader2 } from "lucide-react";
import type { PublicProject } from "@/lib/types";
import { ytThumb } from "@/components/app/use-projects";
import { cn } from "@/lib/utils";

export function ProjectCard({ p, actions }: { p: PublicProject; actions?: React.ReactNode }) {
  const thumb = ytThumb(p);
  const Icon = p.source_type === "youtube" ? Youtube : p.source_type === "file" ? Film : FileText;
  const date = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-line bg-white/[.025] transition hover:border-white/20">
      <Link href={p.status === "ready" ? `/clips/${p.id}` : "#"} className="block">
        <div className="relative aspect-video overflow-hidden bg-[radial-gradient(90%_80%_at_30%_20%,rgba(255,61,127,.35),#0b0b0d)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {thumb && <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover opacity-80 transition group-hover:scale-[1.03]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur"><Icon className="h-3.5 w-3.5" />{p.source_type === "youtube" ? "YouTube" : p.source_type === "file" ? "Upload" : "Script"}</span>
          {p.status === "ready" && (
            <span className={cn("absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[12px] font-bold", p.locked ? "bg-white/15 text-white backdrop-blur" : "bg-lime text-ink")}>
              {p.locked && <Lock className="h-3 w-3" />}{p.clips.length} clips · best {p.bestScore}
            </span>
          )}
          {p.status === "working" && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[12px] text-white backdrop-blur"><Loader2 className="h-3 w-3 animate-spin" />Finding clips…</span>}
          {p.status === "failed" && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-hot/80 px-2.5 py-1 text-[12px] text-white"><AlertCircle className="h-3 w-3" />Didn&apos;t work</span>}
        </div>
        <div className="p-4">
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-white">{p.title ?? p.file_name ?? "Untitled video"}</p>
          <p className="mt-1 text-[12.5px] text-mute">{date}</p>
        </div>
      </Link>
      {actions && <div className="absolute right-2 top-2">{actions}</div>}
    </div>
  );
}

export function ProjectSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-line">
      <div className="skeleton aspect-video" />
      <div className="space-y-2 p-4"><div className="skeleton h-4 w-4/5 rounded" /><div className="skeleton h-3 w-1/4 rounded" /></div>
    </div>
  );
}
