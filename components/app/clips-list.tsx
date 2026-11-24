"use client";
import { useState } from "react";
import Link from "next/link";
import { Film, Trash2, Search } from "lucide-react";
import { PageTitle, EmptyState, ErrorState } from "@/components/app/shell";
import { ProjectCard, ProjectSkeleton } from "@/components/app/project-card";
import { useProjects } from "@/components/app/use-projects";
import { Sheet } from "@/components/ui/sheet";
import { GhostButton } from "@/components/ui/main-button";
import { QUOTAS } from "@/lib/plans";

export function ClipsList() {
  const { data, error, reload, setData } = useProjects();
  const [q, setQ] = useState("");
  const [del, setDel] = useState<{ id: string; title: string } | null>(null);
  const list = (data?.projects ?? []).filter((p) => !q || (p.title ?? "").toLowerCase().includes(q.toLowerCase()));
  const days = data ? QUOTAS[data.usage.tier].historyDays : null;

  async function remove() {
    if (!del || !data) return;
    const id = del.id;
    setDel(null);
    setData({ ...data, projects: data.projects.filter((p) => p.id !== id) });
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <PageTitle title="Clips" sub={days ? `Every video you turned into clips · kept ${days} days on your plan` : "Every video you turned into clips"} right={<Link href="/upload" className="inline-flex h-10 items-center rounded-full bg-lime px-4 text-[14px] font-semibold text-ink active:scale-95">New video</Link>} />
      {!!data?.projects.length && (
        <label className="mb-5 flex h-11 max-w-[360px] items-center gap-2 rounded-full border border-line-2 bg-white/[.03] px-4">
          <Search className="h-4 w-4 text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your videos" aria-label="Search" className="flex-1 bg-transparent text-[15px] text-white placeholder:text-mute-2 outline-none" />
        </label>
      )}
      {error ? <ErrorState text="We couldn't load your clips." onRetry={reload} />
        : !data ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <ProjectSkeleton key={i} />)}</div>
        : !data.projects.length ? <EmptyState icon={Film} text="No clips yet. Turn your first long video into clips." action={<Link href="/upload" className="inline-flex h-10 items-center rounded-full bg-lime px-5 text-[14px] font-semibold text-ink">Find my clips</Link>} />
        : !list.length ? <p className="py-10 text-center text-[15px] text-mute">No video matches “{q}”.</p>
        : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <ProjectCard key={p.id} p={p} actions={
                <button onClick={() => setDel({ id: p.id, title: p.title ?? "this video" })} aria-label="Delete" className="grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white/80 opacity-100 backdrop-blur transition hover:text-white md:opacity-0 md:group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
              } />
            ))}
          </div>
        )}
      <Sheet open={!!del} onClose={() => setDel(null)} label="Delete video" width={420}>
        <div className="px-6 pb-8 pt-14">
          <h2 className="text-[22px] font-semibold text-white">Delete “{del?.title}”?</h2>
          <p className="mt-2 text-[15px] text-mute">Its clips are deleted too. This can&apos;t be undone.</p>
          <div className="mt-6 flex gap-2">
            <GhostButton className="flex-1" onClick={() => setDel(null)}>Keep it</GhostButton>
            <button onClick={remove} className="h-11 flex-1 rounded-full bg-hot text-[15px] font-semibold text-white active:scale-95">Delete</button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
