import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import { track } from "@/lib/kwop";

// After sign-up / log-in: attach the tries made without an account, save k / plan / source once.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { isNew } = (await req.json().catch(() => ({}))) as { isNew?: boolean };
  const store = await cookies();
  const tid = store.get("vf_try")?.value;
  const db = supabaseAdmin();
  if (tid) await db.from("projects").update({ user_id: user.id }).eq("try_id", tid).is("user_id", null);
  const { data: prof } = await db.from("profiles").select("k, intended_plan, source").eq("id", user.id).maybeSingle();
  const patch: Record<string, string> = {};
  const k = store.get("kwop_k")?.value;
  if (k && !prof?.k) patch.k = k;
  const plan = store.get("vf_plan")?.value;
  if (plan && !prof?.intended_plan) patch.intended_plan = plan;
  const src = store.get("vf_src")?.value;
  if (src && !prof?.source) patch.source = src;
  await db.from("profiles").upsert({ id: user.id, email: user.email, ...patch });
  const created = new Date(user.created_at).getTime();
  if (isNew || Date.now() - created < 5 * 60_000) track("signup", user.email);
  const { data: last } = await db.from("projects").select("id").eq("user_id", user.id).eq("status", "ready").order("created_at", { ascending: false }).limit(1).maybeSingle();
  return NextResponse.json({ ok: true, lastProject: last?.id ?? null });
}
