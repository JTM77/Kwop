import Link from "next/link";
import { Logo } from "@/components/ui/logo";
export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <Link href="/" className="inline-flex"><Logo /></Link>
        <p className="title-xl mt-10 text-[64px] text-white">404</p>
        <p className="mt-2 text-[17px] text-mute">This page doesn&apos;t exist. Your clips do.</p>
        <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-full bg-lime px-6 text-[15px] font-semibold text-ink">Back to Vidflow</Link>
      </div>
    </div>
  );
}
