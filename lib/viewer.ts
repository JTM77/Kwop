import "server-only";
import { cookies, headers } from "next/headers";
import { createHash, randomUUID } from "crypto";
import { getUser } from "@/lib/supabase/server";
import { getPlan, type PlanState } from "@/lib/kwop";
import { QUOTAS, tierFromName, type Tier } from "@/lib/plans";

export type Viewer = {
  id: string | null;
  email: string | null;
  plan: PlanState;
  tier: Tier;
  paid: boolean;
};

export async function getViewer(opts: { fresh?: boolean } = {}): Promise<Viewer> {
  const user = await getUser();
  if (!user?.email) return { id: user?.id ?? null, email: user?.email ?? null, plan: { paid: false, plan: null, status: null, until: null }, tier: "free", paid: false };
  const plan = await getPlan(user.email, opts);
  const tier = plan.paid ? tierFromName(plan.plan?.name) : "free";
  return { id: user.id, email: user.email, plan, tier, paid: plan.paid };
}

export async function tryId(create = false): Promise<string | null> {
  const store = await cookies();
  let id = store.get("vf_try")?.value ?? null;
  if (!id && create) {
    id = randomUUID();
    store.set("vf_try", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90, secure: process.env.NODE_ENV === "production" });
  }
  return id;
}

export async function ipHash() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  return createHash("sha256").update(`${ip}:${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12) ?? "vf"}`).digest("hex").slice(0, 32);
}

/** Start of the current billing period (from Kwop's renewal date), or 30 days ago. */
export function periodStart(v: Viewer): Date {
  const now = Date.now();
  if (v.plan.until) {
    const until = new Date(v.plan.until).getTime();
    if (!Number.isNaN(until) && until > now) {
      const len = until - now > 40 * 86400_000 ? 365 : 30;
      return new Date(until - len * 86400_000);
    }
  }
  return new Date(now - 30 * 86400_000);
}

export function quotaFor(v: Viewer) {
  return QUOTAS[v.tier];
}
