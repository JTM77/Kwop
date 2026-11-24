import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { sharedClip } from "@/lib/share";
import { Logo } from "@/components/ui/logo";

type P = { params: Promise<{ id: string; clip: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { id, clip } = await params;
  const c = await sharedClip(id, clip);
  if (!c) return { title: "Clip not found" };
  return { title: c.title, description: `Virality score ${c.score}/100 · made with Vidflow`, openGraph: { title: c.title, description: `Virality score ${c.score}/100 · made with Vidflow` } };
}

export default async function Page({ params }: P) {
  const { id, clip } = await params;
  const c = await sharedClip(id, clip);
  if (!c) notFound();
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-16">
      <Script src="https://kwop.io/flow.js" data-site="s_7eb31daa9a" strategy="afterInteractive" />
      <div className="dot-grid pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-[560px] text-center">
        <Link href="/" className="inline-flex"><Logo /></Link>
        <p className="label mt-10 text-lime">[ Clip found by Vidflow ]</p>
        <h1 className="title-xl mt-4 text-[40px] text-white md:text-[56px]">{c.title}</h1>
        <p className="mt-3 text-[16px] text-mute">Hook: “{c.hook}”{c.from ? ` · from “${c.from}”` : ""}</p>
        <div className="mx-auto mt-6 flex max-w-[360px] items-center gap-3">
          <span className="text-[13px] text-mute">Virality</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-hot to-flame" style={{ width: `${c.score}%` }} /></span>
          <span className="font-mono text-[15px] font-bold text-white">{c.score}</span>
        </div>
        <Link href="/#try" className="mt-10 inline-flex h-14 items-center gap-2 rounded-full bg-lime px-7 text-[17px] font-semibold text-ink active:scale-95">Find my clips →</Link>
        <p className="mt-4 font-mono text-[12px] text-mute">Free to try · No card</p>
      </div>
    </div>
  );
}
