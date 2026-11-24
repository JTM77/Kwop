import { NextResponse } from "next/server";
import { getViewer } from "@/lib/viewer";

export async function GET(req: Request) {
  const fresh = new URL(req.url).searchParams.has("fresh");
  const v = await getViewer({ fresh });
  return NextResponse.json({ id: v.id, email: v.email, paid: v.paid, tier: v.tier, plan: v.plan.plan, until: v.plan.until, status: v.plan.status });
}
