import { NextResponse } from "next/server";
import { getViewer } from "@/lib/viewer";

// Smart B-Roll: free stock footage from Wikimedia Commons (CC-licensed, CORS-enabled), cached a day.
type Hit = { url: string; thumb: string | null; title: string; page: string };
const cache = new Map<string, { v: Hit[]; at: number }>();

export async function GET(req: Request) {
  const viewer = await getViewer();
  if (!viewer.id) return NextResponse.json({ error: "auth" }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (!q) return NextResponse.json({ results: [] });
  const key = q.toLowerCase();
  const c = cache.get(key);
  if (c && Date.now() - c.at < 86400_000) return NextResponse.json({ results: c.v });
  try {
    const api = new URL("https://commons.wikimedia.org/w/api.php");
    api.search = new URLSearchParams({
      action: "query", format: "json", origin: "*", generator: "search",
      gsrsearch: `${q} filetype:video`, gsrnamespace: "6", gsrlimit: "8",
      prop: "videoinfo", viprop: "url|mime|size|derivatives", viurlwidth: "640",
    }).toString();
    const r = await fetch(api, { headers: { "User-Agent": "Vidflow/1.0 (b-roll search)" } });
    const j = await r.json();
    const pages = Object.values(j?.query?.pages ?? {}) as { title: string; index?: number; videoinfo?: { url: string; thumburl?: string; descriptionurl: string; size: number; derivatives?: { src: string; type: string; width: number }[] }[] }[];
    const hits: Hit[] = pages
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .map((p) => {
        const vi = p.videoinfo?.[0];
        if (!vi) return null;
        const small = vi.derivatives?.filter((d) => d.type.includes("webm") && d.width <= 720).sort((a, b) => b.width - a.width)[0];
        const url = small?.src ?? (vi.size < 40_000_000 ? vi.url : null);
        if (!url) return null;
        return { url, thumb: vi.thumburl ?? null, title: p.title.replace(/^File:/, "").replace(/\.[^.]+$/, ""), page: vi.descriptionurl };
      })
      .filter(Boolean) as Hit[];
    cache.set(key, { v: hits, at: Date.now() });
    return NextResponse.json({ results: hits });
  } catch (e) {
    console.error("[broll]", e);
    return NextResponse.json({ results: [] });
  }
}
