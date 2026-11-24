import "server-only";

// Vidflow's server talks only to Kwop for plans, checkout, payments and events.
const API = () => {
  const u = process.env.KWOP_API;
  if (!u) throw new Error("KWOP_API is not set");
  return u.replace(/\/$/, "");
};

export type KwopPlan = {
  id: number;
  name: string;
  price_cents: number;
  currency: string;
  interval: string;
  per_day: string;
  yearly: { price_cents: number; per_day: string } | null;
};

export type KwopInfo = { name: string; checkout: "embedded" | "redirect" | null; plans: KwopPlan[] };

let infoCache: { v: KwopInfo; at: number } | null = null;

export async function getPlans(): Promise<KwopInfo> {
  if (infoCache && Date.now() - infoCache.at < 60_000) return infoCache.v;
  try {
    const r = await fetch(API(), { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const v: KwopInfo = { name: j.name, checkout: j.checkout ?? null, plans: (j.plans ?? []).sort((a: KwopPlan, b: KwopPlan) => a.price_cents - b.price_cents) };
    infoCache = { v, at: Date.now() };
    return v;
  } catch (e) {
    console.error("[kwop] plans failed", e);
    if (infoCache) return infoCache.v;
    return { name: "Vidflow", checkout: null, plans: [] };
  }
}

export type PlanState = { paid: boolean; plan: { id: number; name: string } | null; status: string | null; until: string | null };

const planCache = new Map<string, { v: PlanState; at: number }>();
const lastKnown = new Map<string, PlanState>();

export async function getPlan(email: string, opts: { fresh?: boolean } = {}): Promise<PlanState> {
  const key = email.toLowerCase();
  const c = planCache.get(key);
  if (!opts.fresh && c && Date.now() - c.at < 60_000) return c.v;
  try {
    const r = await fetch(`${API()}/plan?email=${encodeURIComponent(key)}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const v: PlanState = { paid: !!j.paid, plan: j.plan ?? null, status: j.status ?? null, until: j.until ?? null };
    planCache.set(key, { v, at: Date.now() });
    lastKnown.set(key, v);
    return v;
  } catch (e) {
    console.error("[kwop] getPlan failed", e);
    return lastKnown.get(key) ?? { paid: false, plan: null, status: null, until: null };
  }
}

export async function createCheckout(input: { plan: number; period: "month" | "year"; email: string; k?: string | null }) {
  const body: Record<string, unknown> = { plan: input.plan, period: input.period, email: input.email };
  if (input.k) body.k = input.k;
  const r = await fetch(`${API()}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j as { embed?: string | null; ref?: string; fallback_url?: string; error?: string } };
}

export async function confirmCheckout(ref: string) {
  const r = await fetch(`${API()}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref }), cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  return j as { ok?: boolean; paid?: boolean };
}

export async function cancelPlan(email: string, exceptRef?: string) {
  const body: Record<string, unknown> = { email };
  if (exceptRef) body.except_ref = exceptRef;
  const r = await fetch(`${API()}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  return j as { message?: string; manage_url?: string };
}

export type KwopEvent = "signup" | "onboarding_done" | "aha" | "paywall_view" | "feature_used";

/** Fire-and-forget: never blocks, never throws. */
export function track(type: KwopEvent, email: string | null | undefined, detail?: string) {
  if (!email) return;
  try {
    const body: Record<string, unknown> = { type, email };
    if (detail) body.detail = detail;
    fetch(`${API()}/event`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
  } catch {
    /* never throw */
  }
}
