"use client";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// After Google sign-in: attach the try made before sign-up, then go back where the person was.
export default function Page() {
  useEffect(() => {
    const next = new URL(location.href).searchParams.get("next") ?? "/dashboard";
    const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    fetch("/api/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .catch(() => null)
      .finally(() => location.replace(safe.startsWith("/?") || safe === "/" ? "/dashboard?unlock=1" : safe));
  }, []);
  return <div className="grid min-h-dvh place-items-center text-mute"><Loader2 className="h-6 w-6 animate-spin" /></div>;
}
