import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createCheckout, getPlans } from "@/lib/kwop";
import { cookies } from "next/headers";

const Body = z.object({ plan: z.number().int().positive(), period: z.enum(["month", "year"]) });

export async function POST(req: Request) {
  const user = await getUser();
  if (!user?.email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { plans } = await getPlans();
  if (!plans.some((p) => p.id === body.data.plan)) return NextResponse.json({ error: "bad_plan" }, { status: 400 });
  const { data: prof } = await supabaseAdmin().from("profiles").select("k").eq("id", user.id).maybeSingle();
  const k = prof?.k ?? (await cookies()).get("kwop_k")?.value ?? null;
  const r = await createCheckout({ plan: body.data.plan, period: body.data.period, email: user.email, k });
  if (r.status === 409) return NextResponse.json({ error: "payments_off" }, { status: 409 });
  if (r.status >= 400 || !r.body.ref) {
    console.error("[checkout] kwop error", r.status, r.body);
    return NextResponse.json({ error: "checkout_failed" }, { status: 502 });
  }
  return NextResponse.json({ embed: r.body.embed ?? null, ref: r.body.ref, fallback_url: r.body.fallback_url ?? null });
}
