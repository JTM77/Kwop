import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink pt-16">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-5 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-[280px] text-[14px] text-mute">Long videos in. Faceless clips with kinetic captions out.</p>
        </div>
        <div className="text-[14px]">
          <p className="label mb-3 text-mute">Product</p>
          <ul className="space-y-2 text-white/75">
            <li><a href="#try" className="hover:text-white">Find my clips</a></li>
            <li><a href="#how" className="hover:text-white">How it works</a></li>
            <li><a href="#faq" className="hover:text-white">Questions</a></li>
            <li><Link href="/login" className="hover:text-white">Log in</Link></li>
          </ul>
        </div>
        <div className="text-[14px]">
          <p className="label mb-3 text-mute">Legal</p>
          <ul className="space-y-2 text-white/75">
            <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
            <li className="text-mute">© {new Date().getFullYear()} Vidflow</li>
          </ul>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none mt-14 select-none text-center font-bold leading-[0.78] tracking-[-0.06em] text-white/[.13] [mask-image:linear-gradient(180deg,#000_30%,transparent)] before:content-['Vidflow']" style={{ fontSize: "clamp(96px, 24vw, 330px)" }} />
    </footer>
  );
}
