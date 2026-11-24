import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { track } from "@/lib/kwop";

const Body = z.object({ type: z.enum(["paywall_view", "feature_used", "aha"]), detail: z.string().max(80).optional() });

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ ok: false }, { status: 400 });
  const user = await getUser();
  track(body.data.type, user?.email, body.data.detail);
  return NextResponse.json({ ok: true });
}
