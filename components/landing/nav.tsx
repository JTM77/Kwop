import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-[14px] z-40 px-3">
      <nav className="mx-auto flex h-[60px] max-w-[980px] items-center justify-between rounded-[24px] border border-white/[.09] bg-[#0c0c0d]/70 pl-4 pr-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,.6)] backdrop-blur-xl">
        <Link href="/" aria-label="Vidflow home"><Logo /></Link>
        <div className="hidden items-center gap-7 text-[14px] text-white/70 md:flex">
          <a href="#how" className="transition hover:text-white">How it works</a>
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#faq" className="transition hover:text-white">Questions</a>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/login" className="rounded-full px-3.5 py-2 text-[14px] font-medium text-white/80 transition hover:text-white">Log in</Link>
          <a href="#try" className="inline-flex h-10 items-center rounded-full bg-lime px-4 text-[14px] font-semibold text-ink transition active:scale-95">Find my clips</a>
        </div>
      </nav>
    </header>
  );
}
