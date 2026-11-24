import { ogImage } from "@/lib/og";
export const alt = "Vidflow — 1 podcast in, 30 faceless TikToks out";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return ogImage({ kicker: "Your 10 clips are ready", title: "1 podcast in. 30 faceless TikToks out.", score: 94, sub: "AI clips · kinetic captions · b-roll" });
}
