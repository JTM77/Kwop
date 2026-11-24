import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { cancelPlan, getPlan } from "@/lib/kwop";

export async function POST() {
  const user = await getUser();
  if (!user?.email) return NextResponse.json({ error: "auth" }, { status: 401 });
  const r = await cancelPlan(user.email);
  await getPlan(user.email, { fresh: true });
  return NextResponse.json({ message: r.message ?? "Your subscription is canceled. You keep your plan until the end of the period.", manage_url: r.manage_url ?? null });
}
