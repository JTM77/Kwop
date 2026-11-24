"use client";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function useIsDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 768px)");
    const f = () => setD(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return d;
}

/**
 * Sheet: a bottom sheet with a grab handle on a phone (or full screen with `full`),
 * a centered card on a computer.
 */
export function Sheet({
  open,
  onClose,
  children,
  width = 480,
  full = false,
  label,
  z = 50,
  closeSide = "left",
  className,
  hideClose = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  full?: boolean;
  label: string;
  z?: number;
  closeSide?: "left" | "right";
  className?: string;
  hideClose?: boolean;
}) {
  const desktop = useIsDesktop();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, damping: 32, stiffness: 340, mass: 0.9 };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0" style={{ zIndex: z }} role="dialog" aria-modal="true" aria-label={label}>
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <div className={cn("pointer-events-none absolute inset-0 flex", desktop ? "items-center justify-center p-6" : "items-end")}>
            <motion.div
              className={cn(
                "pointer-events-auto relative flex w-full flex-col overflow-hidden border border-line bg-ink-2 text-white shadow-[0_30px_120px_-20px_rgba(0,0,0,.8)]",
                desktop ? "max-h-[min(92vh,900px)] rounded-[24px]" : full ? "h-[100dvh] rounded-none" : "max-h-[94dvh] rounded-t-[26px]",
                className,
              )}
              style={desktop ? { maxWidth: width } : undefined}
              initial={desktop ? { opacity: 0, y: 24, scale: 0.97 } : { y: "100%" }}
              animate={desktop ? { opacity: 1, y: 0, scale: 1 } : { y: 0 }}
              exit={desktop ? { opacity: 0, y: 16, scale: 0.98 } : { y: "100%" }}
              transition={spring}
              drag={!desktop && !full ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={onDragEnd}
            >
              {!desktop && !full && (
                <div className="flex shrink-0 justify-center pt-2.5 pb-1">
                  <span className="h-1.5 w-11 rounded-full bg-white/20" />
                </div>
              )}
              {!hideClose && (
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className={cn(
                    "absolute top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/[.06] text-white/80 transition hover:bg-white/[.12] active:scale-95",
                    closeSide === "left" ? "left-3" : "right-3",
                    !desktop && !full && "top-4",
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-sheet-scroll>
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
