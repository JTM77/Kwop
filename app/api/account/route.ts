import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cancelPlan, getPlan } from "@/lib/kwop";

const Patch = z.object({
  caption_style: z.enum(["pop", "minimal", "karaoke", "neon", "typewriter", "beast"]).optional(),
  brand_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  answers: z.record(z.string(), z.string().max(60)).optional(),
});

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { data } = await supabaseAdmin().from("profiles").select("email, caption_style, brand_color, answers, created_at").eq("id", user.id).maybeSingle();
  return NextResponse.json({ profile: data });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user?.email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = Patch.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const plan = await getPlan(user.email);
  const name = (plan.plan?.name ?? "").toLowerCase();
  if (body.data.brand_color && !(plan.paid && name.includes("pro"))) return NextResponse.json({ error: "upgrade", message: "Brand colors come with Pro." }, { status: 402 });
  const { data } = await supabaseAdmin().from("profiles").update(body.data).eq("id", user.id).select("email, caption_style, brand_color, answers").single();
  return NextResponse.json({ profile: data });
}

// "Delete my account": cancel the subscription, then delete the user and all their data.
export async function DELETE() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (user.email) {
    const p = await getPlan(user.email, { fresh: true });
    if (p.paid) await cancelPlan(user.email).catch(() => null);
  }
  const db = supabaseAdmin();
  const { data: files } = await db.storage.from("audio").list(user.id);
  if (files?.length) await db.storage.from("audio").remove(files.map((f) => `${user.id}/${f.name}`));
  await db.from("projects").delete().eq("user_id", user.id);
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
