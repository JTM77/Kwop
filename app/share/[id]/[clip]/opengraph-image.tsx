import { ogImage } from "@/lib/og";
import { sharedClip } from "@/lib/share";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image({ params }: { params: Promise<{ id: string; clip: string }> }) {
  const { id, clip } = await params;
  const c = await sharedClip(id, clip).catch(() => null);
  return ogImage({ kicker: "Clip found by Vidflow", title: c?.title ?? "Your clips are ready", score: c?.score ?? null, sub: c?.from ? `from “${c.from}”` : undefined });
}
