import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getViewer, ipHash, periodStart, quotaFor, tryId } from "@/lib/viewer";
import { analyzeText, analyzeYouTube, AiError } from "@/lib/ai";
import { toPublic, youtubeId, type ProjectRow } from "@/lib/projects";
import { track } from "@/lib/kwop";
import type { Analysis } from "@/lib/captions";

export const maxDuration = 300;

const Body = z.union([
  z.object({ url: z.string().trim().min(5).max(300) }),
  z.object({ text: z.string().trim().min(200, "Paste at least a few paragraphs (200 characters).").max(60000) }),
]);

const FREE_PER_DAY = 3;

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_input", message: parsed.error.issues[0]?.message ?? "Paste a YouTube link or a script." }, { status: 400 });
  }
  const viewer = await getViewer();
  const db = supabaseAdmin();
  const tid = await tryId(true);
  const ip = await ipHash();
  const since = new Date(Date.now() - 86400_000).toISOString();

  // limits: free tries (3 a day per device and per IP), paid quota per billing period
  if (viewer.paid && viewer.id) {
    const q = quotaFor(viewer);
    const { count } = await db.from("projects").select("id", { count: "exact", head: true }).eq("user_id", viewer.id).eq("counted", true).gte("created_at", periodStart(viewer).toISOString());
    if ((count ?? 0) >= q.videos) return NextResponse.json({ error: "quota", message: `You used your ${q.videos} videos this month.` }, { status: 402 });
  } else {
    const byDevice = viewer.id
      ? await db.from("projects").select("id", { count: "exact", head: true }).eq("user_id", viewer.id).gte("created_at", since)
      : await db.from("projects").select("id", { count: "exact", head: true }).eq("try_id", tid).is("user_id", null).gte("created_at", since);
    const byIp = await db.from("projects").select("id", { count: "exact", head: true }).eq("ip_hash", ip).eq("counted", false).gte("created_at", since);
    if ((byDevice.count ?? 0) >= FREE_PER_DAY || (byIp.count ?? 0) >= FREE_PER_DAY * 2) {
      return NextResponse.json({ error: "rate", message: "You've used your 3 free tries today. Unlock Vidflow to keep going." }, { status: 429 });
    }
  }

  let sourceType: "youtube" | "text";
  let sourceUrl: string | null = null;
  let cacheKey: string | null = null;
  if ("url" in parsed.data) {
    const id = youtubeId(parsed.data.url);
    if (!id) return NextResponse.json({ error: "bad_input", message: "Paste a YouTube link (youtube.com or youtu.be). Have a file? Upload it after you sign in." }, { status: 400 });
    sourceType = "youtube";
    sourceUrl = `https://www.youtube.com/watch?v=${id}`;
    cacheKey = `yt:${id}`;
  } else {
    sourceType = "text";
  }

  const { data: row, error } = await db
    .from("projects")
    .insert({ user_id: viewer.id, try_id: tid, ip_hash: ip, source_type: sourceType, source_url: sourceUrl, status: "working", counted: viewer.paid })
    .select("*")
    .single<ProjectRow>();
  if (error || !row) {
    console.error("[try] insert", error);
    return NextResponse.json({ error: "server", message: "Something went wrong on our side. Try again." }, { status: 500 });
  }

  try {
    let analysis: Analysis | null = null;
    if (cacheKey) {
      const { data: c } = await db.from("analysis_cache").select("analysis").eq("source_key", cacheKey).maybeSingle();
      analysis = (c?.analysis as Analysis) ?? null;
    }
    if (!analysis) {
      analysis = sourceType === "youtube" ? await analyzeYouTube(sourceUrl!) : await analyzeText((parsed.data as { text: string }).text);
      if (cacheKey) await db.from("analysis_cache").upsert({ source_key: cacheKey, analysis });
    }
    const q = quotaFor(viewer);
    if (viewer.paid && analysis.duration > q.maxMinutes * 60 + 60) {
      await db.from("projects").update({ status: "failed", error: "too_long", counted: false }).eq("id", row.id);
      return NextResponse.json({ error: "too_long", message: `This video is longer than ${q.maxMinutes} minutes, the limit of your plan.` }, { status: 402 });
    }
    const { data: done } = await db
      .from("projects")
      .update({ status: "ready", analysis, title: analysis.title, duration: analysis.duration, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .select("*")
      .single<ProjectRow>();
    track("onboarding_done", viewer.email);
    track("feature_used", viewer.email, "AI Clip Finder");
    return NextResponse.json({ project: toPublic(done!, viewer.paid) });
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("ai_failed", String(e));
    console.error("[try] analysis failed", err.code, err.message);
    await db.from("projects").update({ status: "failed", error: err.code, counted: false }).eq("id", row.id);
    const message =
      err.code === "bad_source" || err.code === "too_long" || err.code === "no_clips"
        ? err.message
        : err.code === "missing_key"
          ? "Vidflow's AI is being switched on. Your link is fine — try again in a few minutes."
          : "The AI hit a snag on this one. Try again.";
    return NextResponse.json({ error: err.code, message }, { status: 422 });
  }
}
