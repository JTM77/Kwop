"use client";
import { useEffect } from "react";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <p className="title-xl text-[40px] text-white">Something broke on our side.</p>
        <p className="mt-2 text-[16px] text-mute">Your clips are safe. Try again.</p>
        <button onClick={reset} className="mt-6 inline-flex h-12 items-center rounded-full bg-lime px-6 text-[15px] font-semibold text-ink">Try again</button>
      </div>
    </div>
  );
}
