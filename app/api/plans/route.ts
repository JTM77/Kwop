import { NextResponse } from "next/server";
import { getPlans } from "@/lib/kwop";

export async function GET() {
  const info = await getPlans();
  return NextResponse.json({ checkout: info.checkout, plans: info.plans }, { headers: { "Cache-Control": "public, s-maxage=60" } });
}
