import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Script from "next/script";
import fs from "fs";
import path from "path";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toPublic, type ProjectRow } from "@/lib/projects";
import { Nav } from "@/components/landing/nav";
import { DemoPhone } from "@/components/landing/demo-phone";
import { Vsl } from "@/components/landing/vsl";
import { Problem, HowItWorks, Features, Compare, Questions, FinalCta, StickyCta } from "@/components/landing/sections";
import { Footer } from "@/components/landing/footer";
import { TryFlow } from "@/components/try/try-flow";
import { UnlockProvider } from "@/components/paywall/unlock-provider";
import { Reveal } from "@/components/ui/reveal";
import { SectionLabel } from "@/components/ui/label";
import type { PublicProject } from "@/lib/types";

export const dynamic = "force-dynamic";

async function lastTry(): Promise<PublicProject | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const tid = (await cookies()).get("vf_try")?.value;
  if (!tid) return null;
  const { data } = await supabaseAdmin().from("projects").select("*").eq("try_id", tid).is("user_id", null).eq("status", "ready").order("created_at", { ascending: false }).limit(1).maybeSingle<ProjectRow>();
  return data ? toPublic(data, false) : null;
}

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await getUser();
  if (user) redirect(sp.unlock ? "/dashboard?unlock=1" : "/dashboard");
  const initial = await lastTry();
  const hasVideo = fs.existsSync(path.join(process.cwd(), "public", "vsl.mp4"));

  return (
    <UnlockProvider initialMe={{ id: null, email: null, paid: false, tier: "free", plan: null, until: null, status: null }}>
      <Script src="https://kwop.io/flow.js" data-site="s_7eb31daa9a" strategy="lazyOnload" />
      <Nav />
      <main className="overflow-x-clip">
        {/* HERO: the product's first step, working for real */}
        <section className="relative pb-16 pt-32 md:pb-24 md:pt-40">
          <div className="dot-grid pointer-events-none absolute inset-0 h-[900px]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,61,127,.22),rgba(200,255,61,.08),transparent)] blur-2xl" />
          <div className="relative mx-auto max-w-[1120px] px-5">
            <div className="grid items-center gap-12 md:grid-cols-[1.25fr_1fr]">
              <div className="text-center md:text-left">
                {/* no JS fade on the hero text: it is the first thing people (and the LCP) see */}
                <div className="hero-in">
                  <SectionLabel>AI clips for faceless creators</SectionLabel>
                  <h1 className="title-xl mt-5 text-[44px] text-white sm:text-[56px] md:text-[76px]">
                    1 podcast in.<br />30 faceless TikToks out.
                    <span className="grad-text mt-1 block text-[30px] sm:text-[40px] md:text-[52px]">In about 2 minutes.</span>
                  </h1>
                  <p className="mx-auto mt-5 max-w-[520px] text-[17px] leading-relaxed text-white/70 md:mx-0 md:text-[19px]">
                    Paste a long video. Vidflow finds the <b className="text-white">viral moments</b> and adds <b className="text-white">kinetic captions</b> and b-roll for you.
                  </p>
                </div>
                <div className="mt-8 md:max-w-[600px]">
                  <TryFlowSlot initial={initial} autoUnlock={!!sp.unlock} />
                </div>
                <p className="mt-5 font-mono text-[12px] text-mute">Free to try · No card · Clips in ~60 seconds</p>
              </div>
              <Reveal delay={0.15} className="flex justify-center">
                <DemoPhone />
              </Reveal>
            </div>
            <div id="result-anchor" />
          </div>
        </section>

        {/* VSL */}
        <section className="pb-16 md:pb-28">
          <div className="mx-auto max-w-[1040px] px-5">
            <Reveal className="mb-6 text-center">
              <SectionLabel>Watch · 60 seconds</SectionLabel>
              <h2 className="title-xl mt-3 text-[32px] text-white md:text-[48px]">How I turned a 1-hour podcast into 30 faceless TikToks in 2 minutes</h2>
            </Reveal>
            <Reveal><Vsl hasVideo={hasVideo} /></Reveal>
          </div>
        </section>

        <Problem />
        <HowItWorks />
        <Features />
        <Compare />
        <Questions />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </UnlockProvider>
  );
}

function TryFlowSlot({ initial, autoUnlock }: { initial: PublicProject | null; autoUnlock: boolean }) {
  return <TryFlow initialProject={initial} autoUnlock={autoUnlock} />;
}
