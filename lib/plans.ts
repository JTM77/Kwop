// Vidflow quotas per plan tier, counted on the server per billing period.
export type Tier = "free" | "starter" | "creator" | "pro";

export type Quota = {
  videos: number; // videos analyzed per period (each gives up to 10 clips)
  maxMinutes: number; // max source length
  styles: "basic" | "all";
  broll: boolean;
  brand: boolean;
  exportHeight: 720 | 1080;
  fps: 30 | 60;
  historyDays: number | null;
};

export const QUOTAS: Record<Tier, Quota> = {
  free: { videos: 0, maxMinutes: 0, styles: "basic", broll: false, brand: false, exportHeight: 720, fps: 30, historyDays: 7 },
  starter: { videos: 4, maxMinutes: 45, styles: "basic", broll: false, brand: false, exportHeight: 720, fps: 30, historyDays: 30 },
  creator: { videos: 15, maxMinutes: 120, styles: "all", broll: true, brand: false, exportHeight: 1080, fps: 30, historyDays: 365 },
  pro: { videos: 40, maxMinutes: 180, styles: "all", broll: true, brand: true, exportHeight: 1080, fps: 60, historyDays: null },
};

export const TIER_ORDER: Tier[] = ["free", "starter", "creator", "pro"];

export function tierFromName(name: string | null | undefined): Tier {
  const n = (name ?? "").toLowerCase();
  if (n.includes("pro")) return "pro";
  if (n.includes("creator")) return "creator";
  if (n.includes("starter")) return "starter";
  return name ? "starter" : "free";
}

export function shortName(name: string) {
  return name.replace(/^vidflow\s+/i, "");
}

/** Plan tag + "What you unlock" lines, in the niche's words. */
export const PLAN_COPY: Record<Exclude<Tier, "free">, { tag: string; unlock: string[]; adds: string[] }> = {
  starter: {
    tag: "For your first faceless channel",
    unlock: ["4 videos a month → up to 40 clips", "Videos up to 45 minutes", "Bold Pop + Minimal kinetic captions", "Virality score on every clip", "720p vertical export, no watermark"],
    adds: ["Turn 4 long videos a month into clips", "Kinetic captions on every clip", "Download ready-to-post vertical videos"],
  },
  creator: {
    tag: "For posting every single day",
    unlock: ["15 videos a month → up to 150 clips", "Videos up to 2 hours", "All 6 kinetic caption styles", "Smart B-Roll cut-ins on every clip", "1080p HD vertical export", "1 year of clip history"],
    adds: ["15 videos a month instead of 4 (150 clips)", "All 6 caption styles + Smart B-Roll", "1080p HD export, videos up to 2 hours"],
  },
  pro: {
    tag: "For running several faceless channels",
    unlock: ["40 videos a month → up to 400 clips", "Videos up to 3 hours", "Your brand color on every caption", "Smart B-Roll + all 6 caption styles", "1080p 60fps export, priority AI", "Clip history kept forever"],
    adds: ["40 videos a month (400 clips)", "Your brand color on every caption", "1080p 60fps export and priority AI"],
  },
};
