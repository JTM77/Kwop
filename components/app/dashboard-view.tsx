"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Film, Lock } from "lucide-react";
import { PageTitle, EmptyState, ErrorState } from "@/components/app/shell";
import { LinkFinder } from "@/components/app/link-finder";
import { ProjectCard, ProjectSkeleton } from "@/components/app/project-card";
import { UsageMeter } from "@/components/app/usage-meter";
import { useProjects } from "@/components/app/use-projects";
import { useUnlock } from "@/components/paywall/unlock-provider";
import { Reveal } from "@/components/ui/reveal";

export function DashboardView() {
  const { data, error, reload } = useProjects();
  const { me, unlock, plans, onUnlocked } = useUnlock();
  useEffect(() => onUnlocked(reload), [onUnlocked, reload]);
  const ready = data?.projects.filter((p) => p.status === "ready") ?? [];
  const last = ready[0];
  const creator = plans.find((p) => /creator/i.test(p.name));
  const ctx = last ? { title: `Your ${last.clips.length} clips are ready.`, line: `From “${last.title}”. Your best moment scored ${last.bestScore}/100.` } : undefined;

  // back from Google sign-in on the try-first funnel: open the paywall over the result
  useEffect(() => {
    if (!data) return;
    const u = new URL(location.href);
    if (u.searchParams.get("unlock") === "1") {
      history.replaceState(null, "", "/dashboard");
      fetch("/api/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(() => reload());
      if (!me?.paid) setTimeout(() => unlock(ctx), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data === null]);

  const first = me?.email?.split("@")[0];

  return (
    <div>
      <PageTitle title={first ? `Hey ${first}` : "Dashboard"} sub="Paste a long video. Get clips ready to post." />
      <Reveal><LinkFinder /></Reveal>
      <div className="mt-8">{data && <UsageMeter usage={data.usage} />}</div>

      {last?.locked && (
        <Reveal className="mt-8">
          <button onClick={() => unlock(ctx)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[20px] border border-lime/40 bg-lime/[.06] px-5 py-4 text-left active:scale-[.99]">
            <span>
              <span className="block text-[16px] font-semibold text-white">Your {last.clips.length} clips from “{last.title}” are waiting</span>
              <span className="text-[14px] text-mute">1 is open. {last.clips.length - 1} are locked.</span>
            </span>
            <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-lime px-4 text-[14px] font-semibold text-ink"><Lock className="h-4 w-4" />Unlock all {last.clips.length} clips{creator ? ` · ${creator.per_day}/day` : ""}</span>
          </button>
        </Reveal>
      )}

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-white">Recent videos</h2>
        {!!data?.projects.length && <Link href="/clips" className="text-[14px] text-lime hover:underline">See all</Link>}
      </div>
      <div className="mt-4">
        {error ? <ErrorState text="We couldn't load your videos." onRetry={reload} />
          : !data ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <ProjectSkeleton key={i} />)}</div>
          : !data.projects.length ? <EmptyState icon={Film} text="No clips yet. Paste your first long video above." action={<a href="#" onClick={(e) => { e.preventDefault(); document.querySelector<HTMLInputElement>("input[aria-label='YouTube link']")?.focus(); }} className="inline-flex h-10 items-center rounded-full bg-lime px-5 text-[14px] font-semibold text-ink">Find my clips</a>} />
          : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.projects.slice(0, 6).map((p) => <ProjectCard key={p.id} p={p} />)}</div>}
      </div>
    </div>
  );
}
