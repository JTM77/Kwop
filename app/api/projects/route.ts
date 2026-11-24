import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getViewer, periodStart, quotaFor } from "@/lib/viewer";
import { toPublic, type ProjectRow } from "@/lib/projects";
import { analyzeAudio, AiError } from "@/lib/ai";
import { track } from "@/lib/kwop";

export const maxDuration = 300;

export async function GET() {
  const viewer = await getViewer();
  if (!viewer.id) return NextResponse.json({ error: "auth" }, { status: 401 });
  const db = supabaseAdmin();
  let q = db.from("projects").select("*").eq("user_id", viewer.id).order("created_at", { ascending: false }).limit(100);
  const days = quotaFor(viewer).historyDays;
  if (days) q = q.gte("created_at", new Date(Date.now() - days * 86400_000).toISOString());
  const { data } = await q;
  const { count } = await db.from("projects").select("id", { count: "exact", head: true }).eq("user_id", viewer.id).eq("counted", true).gte("created_at", periodStart(viewer).toISOString());
  return NextResponse.json({
    projects: (data as ProjectRow[] | null ?? []).map((p) => toPublic(p, viewer.paid)),
    usage: { used: count ?? 0, limit: quotaFor(viewer).videos, tier: viewer.tier },
  });
}

// A video file the user uploaded: its audio track is in storage at `path`.
const FileBody = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webm|ogg|m4a|mp3|wav)$/),
  fileName: z.string().trim().min(1).max(200),
  duration: z.number().positive().max(6 * 3600),
});

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.id || !viewer.paid) return NextResponse.json({ error: "upgrade", message: "Uploading your own file comes with a plan." }, { status: 402 });
  const body = FileBody.safeParse(await req.json().catch(() => null));
  if (!body.success || !body.data.path.startsWith(viewer.id)) return NextResponse.json({ error: "bad_input", message: "That upload didn't work. Try again." }, { status: 400 });
  const q = quotaFor(viewer);
  if (body.data.duration > q.maxMinutes * 60 + 60) return NextResponse.json({ error: "too_long", message: `Your plan takes videos up to ${q.maxMinutes} minutes.` }, { status: 402 });
  const db = supabaseAdmin();
  const { count } = await db.from("projects").select("id", { count: "exact", head: true }).eq("user_id", viewer.id).eq("counted", true).gte("created_at", periodStart(viewer).toISOString());
  if ((count ?? 0) >= q.videos) return NextResponse.json({ error: "quota", message: `You used your ${q.videos} videos this month.` }, { status: 402 });

  const { data: row } = await db
    .from("projects")
    .insert({ user_id: viewer.id, source_type: "file", file_name: body.data.fileName, title: body.data.fileName.replace(/\.[^.]+$/, ""), duration: body.data.duration, status: "working", counted: true })
    .select("*")
    .single<ProjectRow>();
  try {
    const { data: blob, error } = await db.storage.from("audio").download(body.data.path);
    if (error || !blob) throw new AiError("ai_failed", "audio missing");
    const analysis = await analyzeAudio(await blob.arrayBuffer(), blob.type || "audio/webm", body.data.fileName);
    analysis.duration = body.data.duration;
    const { data: done } = await db.from("projects").update({ status: "ready", analysis, title: analysis.title, updated_at: new Date().toISOString() }).eq("id", row!.id).select("*").single<ProjectRow>();
    db.storage.from("audio").remove([body.data.path]).catch(() => {});
    track("feature_used", viewer.email, "AI Clip Finder (upload)");
    return NextResponse.json({ project: toPublic(done!, true) });
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("ai_failed", String(e));
    console.error("[upload] analysis failed", err.message);
    await db.from("projects").update({ status: "failed", error: err.code, counted: false }).eq("id", row!.id);
    return NextResponse.json({ error: err.code, message: err.code === "no_clips" ? err.message : "The AI couldn't read this file. Try again." }, { status: 422 });
  }
}
