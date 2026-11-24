"use client";
import { useEffect, useRef, useState } from "react";

/**
 * A looping animation clock that re-renders at most `fps` times a second (not 60),
 * only while `active`. Kinetic captions and scenes look the same at 15–20 fps,
 * and the main thread stays free for the person tapping the page.
 */
export function useClock({ active, fps = 15, loop, from = 0 }: { active: boolean; fps?: number; loop?: number; from?: number }) {
  const [t, setT] = useState(from);
  const base = useRef({ at: 0, t: from });
  const tRef = useRef(from);
  tRef.current = t;

  useEffect(() => {
    if (!active) return;
    const step = 1000 / fps;
    const b = base.current;
    b.at = performance.now();
    let raf = 0;
    let last = 0;
    const tick = (n: number) => {
      raf = requestAnimationFrame(tick);
      if (n - last < step) return;
      last = n;
      const raw = b.t + (n - b.at) / 1000;
      setT(loop ? raw % loop : raw);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      b.t = tRef.current;
    };
  }, [active, fps, loop]);

  return [t, setT, base] as const;
}

/** True once the page has loaded and the browser is idle: start decorative motion then. */
export function useAfterLoad(delay = 600) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const go = () => {
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      timer = setTimeout(() => (w.requestIdleCallback ? w.requestIdleCallback(() => setReady(true), { timeout: 2000 }) : setReady(true)), delay);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => { clearTimeout(timer); window.removeEventListener("load", go); };
  }, [delay]);
  return ready;
}
