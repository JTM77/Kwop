import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getViewer, tryId } from "@/lib/viewer";
import { toPublic, type ProjectRow } from "@/lib/projects";
import { CAPTION_STYLES } from "@/lib/captions";

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const viewer = await getViewer();
  const tid = await tryId();
  const { data } = await supabaseAdmin().from("projects").select("*").eq("id", id).maybeSingle<ProjectRow>();
  if (!data) return null;
  const mine = (viewer.id && data.user_id === viewer.id) || (!data.user_id && tid && data.try_id === tid);
  if (!mine) return null;
  return { viewer, row: data };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await load((await params).id);
  if (!r) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ project: toPublic(r.row, r.viewer.paid) });
}

const Patch = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  caption_style: z.enum(CAPTION_STYLES.map((s) => s.id) as [string, ...string[]]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await load((await params).id);
  if (!r || !r.viewer.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const body = Patch.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  if (body.data.caption_style && r.viewer.tier !== "creator" && r.viewer.tier !== "pro" && !["pop", "minimal"].includes(body.data.caption_style)) {
    return NextResponse.json({ error: "upgrade", message: "This caption style comes with Creator." }, { status: 402 });
  }
  const { data } = await supabaseAdmin().from("projects").update({ ...body.data, updated_at: new Date().toISOString() }).eq("id", r.row.id).eq("user_id", r.viewer.id).select("*").single<ProjectRow>();
  return NextResponse.json({ project: toPublic(data!, r.viewer.paid) });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await load((await params).id);
  if (!r || !r.viewer.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await supabaseAdmin().from("projects").delete().eq("id", r.row.id).eq("user_id", r.viewer.id);
  return NextResponse.json({ ok: true });
}
