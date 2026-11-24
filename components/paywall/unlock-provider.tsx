"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Lock, ShieldCheck, Sparkles, Wand2, Film, Captions, X } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { AuthForm } from "@/components/auth/auth-form";
import { MainButton } from "@/components/ui/main-button";
import { PLAN_COPY, shortName, tierFromName, TIER_ORDER, type Tier } from "@/lib/plans";
import { cn } from "@/lib/utils";

export type Plan = { id: number; name: string; price_cents: number; currency: string; interval: string; per_day: string; yearly: { price_cents: number; per_day: string } | null };
export type Me = { id: string | null; email: string | null; paid: boolean; tier: Tier; plan: { id: number; name: string } | null; until: string | null; status: string | null };

type UnlockCtx = {
  me: Me | null;
  plans: Plan[];
  refreshMe: (fresh?: boolean) => Promise<Me | null>;
  /** "Unlock" tapped: sign-up sheet first if needed, then the paywall. */
  unlock: (ctx?: { title?: string; line?: string; signupTitle?: string }) => void;
  /** Upgrade sheet: the next plan only. */
  upgrade: (reason: string) => void;
  openPaywall: () => void;
  signupOpen: boolean;
  onUnlocked: (fn: () => void) => () => void;
};

const Ctx = createContext<UnlockCtx | null>(null);
export const useUnlock = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUnlock outside provider");
  return c;
};

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
}
function perDayParts(s: string) {
  return s.replace("$", "");
}
function event(type: string, detail?: string) {
  fetch("/api/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, detail }) }).catch(() => {});
}

export function UnlockProvider({ children, initialMe = null, defaultTitle = "Your 10 clips are ready.", defaultLine }: { children: ReactNode; initialMe?: Me | null; defaultTitle?: string; defaultLine?: string }) {
  const [me, setMe] = useState<Me | null>(initialMe);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [signup, setSignup] = useState<{ title: string } | null>(null);
  const [pay, setPay] = useState<{ title: string; line?: string } | null>(null);
  const [up, setUp] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ plan: Plan; period: "month" | "year"; upgrade: boolean } | null>(null);
  const [film, setFilm] = useState<string | null>(null);
  const listeners = useRef(new Set<() => void>());
  const ctxRef = useRef<{ title?: string; line?: string }>({});

  const refreshMe = useCallback(async (fresh = false) => {
    try {
      const r = await fetch(`/api/me${fresh ? "?fresh=1" : ""}`, { cache: "no-store" });
      const j = (await r.json()) as Me;
      setMe(j);
      return j;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!initialMe) refreshMe();
    fetch("/api/plans").then((r) => r.json()).then((j) => setPlans(j.plans ?? [])).catch(() => {});
  }, [initialMe, refreshMe]);

  const openPaywall = useCallback(() => {
    setPay({ title: ctxRef.current.title ?? defaultTitle, line: ctxRef.current.line ?? defaultLine });
    event("paywall_view");
  }, [defaultTitle, defaultLine]);

  const unlock = useCallback<UnlockCtx["unlock"]>((ctx) => {
    ctxRef.current = { ...ctxRef.current, ...ctx };
    if (!me?.id) setSignup({ title: ctx?.signupTitle ?? "Save your clips" });
    else openPaywall();
  }, [me, openPaywall]);

  const confirm = useCallback(async (ref: string, upgrade: boolean) => {
    setCheckout(null);
    setPay(null);
    setUp(null);
    try {
      const r = await fetch("/api/checkout/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref, upgrade }) });
      const j = await r.json();
      const fresh = await refreshMe(true);
      if (j.paid || fresh?.paid) {
        setFilm(shortName(j.plan?.name ?? fresh?.plan?.name ?? "Vidflow"));
      }
    } catch {
      await refreshMe(true);
    }
  }, [refreshMe]);

  // buyers back from the fallback checkout page: /dashboard?paid=1&ref=…
  useEffect(() => {
    const u = new URL(location.href);
    const ref = u.searchParams.get("ref");
    if (u.searchParams.get("paid") === "1" && ref) {
      u.searchParams.delete("paid");
      u.searchParams.delete("ref");
      history.replaceState(null, "", u.pathname + (u.search ? u.search : ""));
      confirm(ref, false);
    }
  }, [confirm]);

  const onUnlocked = useCallback((fn: () => void) => {
    listeners.current.add(fn);
    return () => { listeners.current.delete(fn); };
  }, []);

  const filmDone = useCallback(() => {
    setFilm(null);
    listeners.current.forEach((f) => f());
  }, []);

  const value = useMemo<UnlockCtx>(() => ({ me, plans, refreshMe, unlock, upgrade: (r) => { setUp(r); event("paywall_view", "upgrade"); }, openPaywall, signupOpen: !!signup, onUnlocked }), [me, plans, refreshMe, unlock, openPaywall, signup, onUnlocked]);

  const currentTier = me?.paid ? tierFromName(me.plan?.name) : "free";

  return (
    <Ctx.Provider value={value}>
      {children}

      <Sheet open={!!signup} onClose={() => setSignup(null)} label="Sign up" width={440}>
        <div className="px-6 pb-8 pt-14 md:px-8">
          <AuthForm
            mode="signup"
            headline={signup?.title ?? "Save your clips"}
            sub="Free account. Your clips wait for you inside."
            cta="Save my clips"
            next={typeof window !== "undefined" ? `${location.pathname}?unlock=1` : "/dashboard"}
            onDone={async (isNew) => {
              await fetch("/api/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isNew }) });
              const m = await refreshMe(true);
              setSignup(null);
              listeners.current.forEach((f) => f());
              if (!m?.paid) setTimeout(openPaywall, 250);
            }}
          />
        </div>
      </Sheet>

      <Paywall
        open={!!pay}
        title={pay?.title ?? defaultTitle}
        line={pay?.line}
        plans={plans}
        onClose={() => setPay(null)}
        onContinue={(plan, period) => setCheckout({ plan, period, upgrade: false })}
      />

      <UpgradeSheet
        open={!!up}
        reason={up ?? ""}
        plans={plans}
        current={currentTier}
        onClose={() => setUp(null)}
        onContinue={(plan) => setCheckout({ plan, period: "month", upgrade: true })}
      />

      <CheckoutSheet
        target={checkout}
        onClose={() => setCheckout(null)}
        onPaid={(ref) => confirm(ref, !!checkout?.upgrade)}
      />

      <UnlockFilm planName={film} onDone={filmDone} />
    </Ctx.Provider>
  );
}

/* ───────────────────────── Paywall ───────────────────────── */

function PlanRows({ plans, period, selected, onSelect }: { plans: Plan[]; period: "month" | "year"; selected: number | null; onSelect: (id: number) => void }) {
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Plans">
      {plans.map((p) => {
        const tier = tierFromName(p.name);
        const copy = tier !== "free" ? PLAN_COPY[tier] : null;
        const featured = tier === "creator";
        const sel = selected === p.id;
        const yearly = period === "year" && p.yearly;
        const perDay = yearly ? p.yearly!.per_day : p.per_day;
        return (
          <button
            key={p.id}
            role="radio"
            aria-checked={sel}
            onClick={() => onSelect(p.id)}
            className={cn(
              "relative flex w-full items-center gap-3 rounded-[18px] border px-4 py-4 text-left transition active:scale-[.985]",
              sel ? "border-lime bg-lime/[.07] shadow-[0_0_0_1px_var(--color-lime)_inset]" : "border-line-2 bg-white/[.02] hover:border-white/30",
            )}
          >
            {featured && <span className="absolute -top-2.5 left-4 rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink">Most popular</span>}
            <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", sel ? "border-lime" : "border-white/30")}>
              {sel && <span className="h-2.5 w-2.5 rounded-full bg-lime" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-semibold text-white">{shortName(p.name)}</span>
              <span className="block text-[13px] text-mute">
                {yearly ? <>{fmtMoney(p.yearly!.price_cents)} / year <span className="text-mute-2 line-through">{fmtMoney(p.price_cents * 12)}</span></> : <>{fmtMoney(p.price_cents)} / month</>}
              </span>
              {copy && <span className="mt-0.5 block truncate text-[12.5px] text-white/60">{copy.tag}</span>}
            </span>
            <span className="text-right">
              <span className="block text-[26px] font-bold leading-none tracking-[-0.03em] text-white" style={{ fontVariantNumeric: "tabular-nums" }}>${perDayParts(perDay)}</span>
              <span className="text-[12px] text-mute">/ day</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const FAQ = [
  { q: "Will it work for my videos?", a: "If people talk in it — podcasts, interviews, talks, storytimes, lessons — Vidflow finds the moments. You already saw your first clip, so you know what you get." },
  { q: "Can I cancel anytime?", a: "Yes. Account → Billing → Cancel my subscription. Two taps, no email, no call. You keep your plan until the end of the period." },
  { q: "What happens right after I pay?", a: "Your clips unlock on this page in a second. Every clip, every caption style in your plan, and the export button. No email to check." },
];

function Paywall({ open, title, line, plans, onClose, onContinue }: { open: boolean; title: string; line?: string; plans: Plan[]; onClose: () => void; onContinue: (p: Plan, period: "month" | "year") => void }) {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [sel, setSel] = useState<number | null>(null);
  const [faq, setFaq] = useState<number | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [btnVisible, setBtnVisible] = useState(true);
  const hasYearly = plans.some((p) => p.yearly);
  const featured = plans.find((p) => tierFromName(p.name) === "creator") ?? plans[Math.floor(plans.length / 2)];
  const plan = plans.find((p) => p.id === sel) ?? featured;
  const tier = plan ? tierFromName(plan.name) : "creator";
  const copy = tier !== "free" ? PLAN_COPY[tier] : PLAN_COPY.creator;

  useEffect(() => {
    if (open && featured && sel === null) setSel(featured.id);
  }, [open, featured, sel]);

  useEffect(() => {
    if (!open) return;
    const el = btnRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBtnVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [open, plans.length]);

  const due = plan ? (period === "year" && plan.yearly ? `${fmtMoney(plan.yearly.price_cents)} due today, then every year` : `${fmtMoney(plan.price_cents)} due today, then every month`) : "";
  const cta = plan ? `Continue with ${shortName(plan.name)}` : "Continue";

  const Body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[19px] font-semibold text-white">Choose your plan.</h3>
        {hasYearly && (
          <div className="flex rounded-full border border-line-2 bg-white/[.03] p-1 text-[13px]">
            {(["month", "year"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={cn("rounded-full px-3 py-1.5 font-medium transition", period === p ? "bg-white text-ink" : "text-mute hover:text-white")}>
                {p === "month" ? "Monthly" : <>Yearly <span className={period === p ? "text-[#3f7a00]" : "text-lime"}>−20%</span></>}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-5">
        {plans.length ? <PlanRows plans={plans} period={period} selected={plan?.id ?? null} onSelect={setSel} /> : <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-[86px] rounded-[18px]" />)}</div>}
      </div>
    </>
  );

  return (
    <Sheet open={open} onClose={onClose} label="Choose your plan" width={480} full z={60}>
      <div className="px-5 pb-32 pt-16 md:px-7 md:pb-10">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-lime text-ink"><Sparkles className="h-6 w-6" /></div>
          <h2 className="text-[30px] font-bold leading-[1.05] tracking-[-0.035em] text-white">{title}</h2>
          {line && <p className="mx-auto mt-2 max-w-[340px] text-[15px] text-mute">{line}</p>}
        </div>
        <div className="mt-8">{Body}</div>
        <div ref={btnRef} className="mt-6">
          <MainButton size="lg" className="w-full" onClick={() => plan && onContinue(plan, period === "year" && plan.yearly ? "year" : "month")} disabled={!plan}>{cta}</MainButton>
          <p className="mt-3 text-center text-[13px] text-mute">{due} · Cancel anytime</p>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[12.5px] text-mute">
          <ShieldCheck className="h-4 w-4 text-lime" /> Secure payment, processed by Whop
          <span className="rounded-md border border-line-2 px-2 py-0.5 font-mono text-[11px]">Whop</span>
          <span className="rounded-md border border-line-2 px-2 py-0.5 font-mono text-[11px]">Card</span>
        </div>

        <div className="mt-8 rounded-[18px] border border-line bg-white/[.02] p-5">
          <p className="text-[15px] font-semibold text-white">What you unlock with {plan ? shortName(plan.name) : "Creator"}</p>
          <ul className="mt-3 space-y-2.5">
            {copy.unlock.map((u) => (
              <li key={u} className="flex gap-2.5 text-[14.5px] text-white/85"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-lime" />{u}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 divide-y divide-line rounded-[18px] border border-line">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button onClick={() => setFaq(faq === i ? null : i)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[15px] font-medium text-white" aria-expanded={faq === i}>
                {f.q}<ChevronDown className={cn("h-4 w-4 shrink-0 text-mute transition", faq === i && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {faq === i && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-5 text-[14px] leading-relaxed text-mute">
                    <span className="block pb-4">{f.a}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <p className="mb-4 text-center text-[13px] font-medium uppercase tracking-[0.14em] text-mute">Pick up where you left off</p>
          <PlanRows plans={plans} period={period} selected={plan?.id ?? null} onSelect={setSel} />
          <MainButton size="md" className="mt-4 w-full" glow={false} onClick={() => plan && onContinue(plan, period === "year" && plan.yearly ? "year" : "month")} disabled={!plan}>{cta}</MainButton>
        </div>

        <p className="mt-6 text-center text-[12px] leading-relaxed text-mute-2">Renews automatically until canceled. Prices in USD.</p>
      </div>
      {!btnVisible && plan && (
        <div className="pointer-events-none sticky bottom-0 z-10 -mt-24 bg-gradient-to-t from-ink-2 via-ink-2/95 to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-6">
          <MainButton size="md" className="pointer-events-auto w-full" glow={false} onClick={() => onContinue(plan, period === "year" && plan.yearly ? "year" : "month")}>{cta}</MainButton>
        </div>
      )}
    </Sheet>
  );
}

/* ───────────────────────── Upgrade sheet ───────────────────────── */

function UpgradeSheet({ open, reason, plans, current, onClose, onContinue }: { open: boolean; reason: string; plans: Plan[]; current: Tier; onClose: () => void; onContinue: (p: Plan) => void }) {
  const idx = TIER_ORDER.indexOf(current);
  const next = plans.find((p) => TIER_ORDER.indexOf(tierFromName(p.name)) > idx);
  const tier = next ? tierFromName(next.name) : null;
  return (
    <Sheet open={open} onClose={onClose} label="Upgrade" width={440} z={60}>
      <div className="px-6 pb-8 pt-14 md:px-8">
        {next && tier && tier !== "free" ? (
          <>
            <p className="label text-lime">[ {reason} ]</p>
            <h2 className="mt-3 text-[28px] font-bold leading-[1.06] tracking-[-0.03em] text-white">Get {shortName(next.name)}</h2>
            <ul className="mt-5 space-y-3">
              {PLAN_COPY[tier].adds.map((a) => (
                <li key={a} className="flex gap-2.5 text-[15px] text-white/90"><Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-lime" />{a}</li>
              ))}
            </ul>
            <div className="mt-6 flex items-end justify-between rounded-[18px] border border-line-2 bg-white/[.03] px-5 py-4">
              <span className="text-[14px] text-mute">{fmtMoney(next.price_cents)} / month</span>
              <span className="text-white"><span className="text-[28px] font-bold tracking-[-0.03em]">{next.per_day}</span><span className="text-[13px] text-mute"> / day</span></span>
            </div>
            <MainButton size="md" className="mt-5 w-full" onClick={() => onContinue(next)}>Continue with {shortName(next.name)}</MainButton>
            <p className="mt-3 text-center text-[12.5px] text-mute">Your current plan stops at the end of its period. Never two plans billed.</p>
          </>
        ) : (
          <>
            <h2 className="text-[26px] font-bold tracking-[-0.03em] text-white">You&apos;re on our biggest plan</h2>
            <p className="mt-3 text-[15px] text-mute">Your quota refills at the start of your next billing period.</p>
          </>
        )}
      </div>
    </Sheet>
  );
}

/* ───────────────────────── Checkout (Whop embedded through Kwop) ───────────────────────── */

type WhopCk = { create: (k: string) => { mount: (sel: string) => void }; destroy?: () => void };
declare global {
  interface Window { WhopElements?: () => { checkout: { create: (o: unknown) => WhopCk } } }
}

let whopLoading: Promise<void> | null = null;
function loadWhop() {
  if (window.WhopElements) return Promise.resolve();
  if (!whopLoading) {
    whopLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.whop.com/elements/amber/elements.js";
      s.setAttribute("data-whop-elements", "");
      s.onload = () => resolve();
      s.onerror = () => { whopLoading = null; reject(new Error("whop")); };
      document.head.appendChild(s);
    });
  }
  return whopLoading;
}

function CheckoutSheet({ target, onClose, onPaid }: { target: { plan: Plan; period: "month" | "year" } | null; onClose: () => void; onPaid: (ref: string) => void }) {
  const [state, setState] = useState<"loading" | "ready" | "off" | "error">("loading");
  const ck = useRef<WhopCk | null>(null);
  const paidRef = useRef(onPaid);
  paidRef.current = onPaid;

  useEffect(() => {
    if (!target) return;
    let dead = false;
    let shown = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setState("loading");
    const show = () => { if (!dead && !shown) { shown = true; setState("ready"); } };
    (async () => {
      try {
        const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: target.plan.id, period: target.period }) });
        if (r.status === 409) { setState("off"); return; }
        if (r.status === 401) { location.href = "/signup"; return; }
        const j = await r.json();
        if (!r.ok) { setState("error"); return; }
        if (!j.embed) { if (j.fallback_url) location.href = j.fallback_url; else setState("error"); return; }
        await loadWhop();
        if (dead || !window.WhopElements) return;
        const c = window.WhopElements().checkout.create({
          checkoutConfiguration: j.embed,
          returnUrl: `${location.origin}/dashboard?paid=1&ref=${encodeURIComponent(j.ref)}`,
          appearance: { theme: { appearance: "dark" } },
          onLoadingChange: (st: unknown) => {
            const loading = st && typeof st === "object" ? (st as { loading?: boolean }).loading : st;
            if (loading === false) show();
          },
          onComplete: (res: { result?: string } | null) => { if (res && res.result === "payment") paidRef.current(j.ref); },
        });
        ck.current = c;
        c.create("checkout").mount("#whop-checkout");
        timers.push(setTimeout(() => { if (document.querySelector("#whop-checkout iframe")) show(); }, 2000));
        timers.push(setTimeout(() => { if (!shown && !dead && j.fallback_url) location.href = j.fallback_url; }, 15000));
      } catch {
        if (!dead) setState("error");
      }
    })();
    return () => {
      dead = true;
      timers.forEach(clearTimeout);
      try { ck.current?.destroy?.(); } catch {}
      ck.current = null;
      const el = document.getElementById("whop-checkout");
      if (el) el.innerHTML = "";
    };
  }, [target]);

  const price = target ? (target.period === "year" && target.plan.yearly ? `${fmtMoney(target.plan.yearly.price_cents)} / year` : `${fmtMoney(target.plan.price_cents)} / month`) : "";

  return (
    <Sheet open={!!target} onClose={onClose} label="Checkout" width={500} z={70} closeSide="right">
      <div className="px-5 pb-6 pt-5 md:px-7 md:pt-6">
        <div className="pr-12">
          <p className="text-[13px] text-mute">Vidflow</p>
          <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-white">{target ? shortName(target.plan.name) : ""} · {price}</h3>
        </div>
        <div className="relative mt-5 min-h-[420px]">
          {state === "loading" && (
            <div className="absolute inset-0 flex flex-col gap-3">
              <p className="flex items-center gap-2 text-[14px] text-mute"><Lock className="h-4 w-4" /> Loading secure checkout…</p>
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 w-2/3 rounded-xl" />
            </div>
          )}
          {state === "off" && (
            <div className="grid min-h-[300px] place-items-center text-center">
              <div>
                <p className="text-[18px] font-semibold text-white">Payments open in a moment.</p>
                <p className="mt-2 text-[15px] text-mute">Your clips are saved.</p>
              </div>
            </div>
          )}
          {state === "error" && (
            <div className="grid min-h-[300px] place-items-center text-center">
              <div>
                <p className="text-[18px] font-semibold text-white">The checkout didn&apos;t load.</p>
                <p className="mt-2 text-[15px] text-mute">Your clips are saved. Check your connection and try again.</p>
                <button onClick={onClose} className="mt-4 rounded-full border border-line-2 px-5 py-2.5 text-[14px] text-white">Try again</button>
              </div>
            </div>
          )}
          <div id="whop-checkout" className={cn("min-h-[420px] transition-opacity", state === "ready" ? "opacity-100" : "opacity-0")} />
        </div>
        <p className="mt-4 text-center text-[12.5px] text-mute">Secure payment by Whop · Cancel in 1 click</p>
      </div>
    </Sheet>
  );
}

/* ───────────────────────── Unlock film ───────────────────────── */

function UnlockFilm({ planName, onDone }: { planName: string | null; onDone: () => void }) {
  const [scene, setScene] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!planName) return;
    setScene(0);
    const a = setTimeout(() => setScene(1), 1600);
    const b = setTimeout(() => setScene(2), 3500);
    const c = setTimeout(onDone, 5200);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
  }, [planName, onDone]);
  const items = [
    { icon: Film, label: "Every clip" },
    { icon: Captions, label: "Kinetic captions" },
    { icon: Wand2, label: "Export in HD" },
  ];
  return (
    <AnimatePresence>
      {planName && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center overflow-hidden bg-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div className="dot-grid absolute inset-0 opacity-60" />
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/20 blur-[120px]" />
          <button onClick={onDone} aria-label="Skip" className="absolute left-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/[.06] text-white/80"><X className="h-5 w-5" /></button>
          <AnimatePresence mode="wait">
            {scene === 0 && (
              <motion.div key="a" className="relative px-6 text-center" initial={{ opacity: 0, scale: reduce ? 1 : 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -16 }} transition={{ type: "spring", damping: 20 }}>
                <motion.div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-[26px] bg-lime text-ink" initial={{ rotate: reduce ? 0 : -12 }} animate={{ rotate: 0 }}><Check className="h-10 w-10" strokeWidth={3} /></motion.div>
                <p className="label text-lime">[ Payment confirmed ]</p>
                <h2 className="title-xl mt-3 text-[46px] text-white md:text-[64px]">You&apos;re on {planName}</h2>
              </motion.div>
            )}
            {scene === 1 && (
              <motion.div key="b" className="relative px-6 text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <h2 className="title-xl text-[34px] text-white md:text-[48px]">Now unlocked</h2>
                <div className="mt-8 flex justify-center gap-4 md:gap-8">
                  {items.map((it, i) => (
                    <motion.div key={it.label} className="flex w-24 flex-col items-center gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i }}>
                      <span className="grid h-16 w-16 place-items-center rounded-2xl border border-line-2 bg-white/[.04] text-lime"><it.icon className="h-7 w-7" /></span>
                      <span className="text-[13px] text-white/80">{it.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            {scene === 2 && (
              <motion.div key="c" className="relative text-center" initial={{ opacity: 0, scale: reduce ? 1 : 1.2 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <h2 className="title-xl text-[72px] text-lime md:text-[110px]">Let&apos;s go</h2>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
