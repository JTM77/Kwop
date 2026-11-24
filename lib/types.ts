import type { Clip } from "@/lib/captions";

export type PublicClip = Clip & { locked: boolean };
export type PublicProject = {
  id: string;
  source_type: "youtube" | "file" | "text";
  source_url: string | null;
  file_name: string | null;
  title: string | null;
  duration: number | null;
  status: "working" | "ready" | "failed";
  error: string | null;
  caption_style: string;
  created_at: string;
  locked: boolean;
  summary: string | null;
  clips: PublicClip[];
  bestScore: number | null;
};
