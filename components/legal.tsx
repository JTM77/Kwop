import Link from "next/link";
import { Logo } from "@/components/ui/logo";
export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[720px] px-5 pb-24 pt-10">
      <Link href="/" className="inline-flex"><Logo /></Link>
      <h1 className="title-xl mt-12 text-[44px] text-white">{title}</h1>
      <p className="mt-2 font-mono text-[12px] text-mute">Last updated {updated}</p>
      <div className="mt-10 space-y-6 text-[16px] leading-relaxed text-white/80 [&_h2]:mt-10 [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:text-white [&_a]:text-lime [&_a]:underline">{children}</div>
    </div>
  );
}
