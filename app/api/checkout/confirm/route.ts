import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { cancelPlan, confirmCheckout, getPlan, track } from "@/lib/kwop";

const Body = z.object({ ref: z.string().trim().min(3).max(120), upgrade: z.boolean().optional() });

export async function POST(req: Request) {
  const user = await getUser();
  if (!user?.email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const before = await getPlan(user.email, { fresh: true });
  const c = await confirmCheckout(body.data.ref);
  let plan = await getPlan(user.email, { fresh: true });
  // Kwop can take a moment to see the payment
  for (let i = 0; i < 4 && !plan.paid; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    plan = await getPlan(user.email, { fresh: true });
  }
  const upgraded = before.paid && before.plan?.id !== plan.plan?.id && plan.paid;
  if (upgraded) await cancelPlan(user.email, body.data.ref).catch(() => null); // never two plans billed
  if (plan.paid && !before.paid) track("aha", user.email);
  return NextResponse.json({ ok: !!c.ok, paid: plan.paid, plan: plan.plan });
}
