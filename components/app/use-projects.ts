"use client";
import { useCallback, useEffect, useState } from "react";
import type { PublicProject } from "@/lib/types";
import type { Tier } from "@/lib/plans";

export type Usage = { used: number; limit: number; tier: Tier };

export function useProjects() {
  const [data, setData] = useState<{ projects: PublicProject[]; usage: Usage } | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setError(false);
    try {
      const r = await fetch("/api/projects", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, error, reload: load, setData };
}

export function ytThumb(p: PublicProject) {
  if (p.source_type !== "youtube" || !p.source_url) return null;
  const id = new URL(p.source_url).searchParams.get("v");
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
}
