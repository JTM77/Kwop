import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Analysis } from "@/lib/captions";

/** Public facts of one shared clip (title, hook, score). Only clips of accounts, never anonymous tries. */
export async function sharedClip(id: string, clipId: string) {
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^c\d{1,2}$/.test(clipId)) return null;
  const { data } = await supabaseAdmin().from("projects").select("title, analysis, user_id, source_type").eq("id", id).maybeSingle();
  if (!data?.user_id) return null;
  const c = (data.analysis as Analysis | null)?.clips.find((x) => x.id === clipId);
  if (!c) return null;
  return { title: c.title, hook: c.hook, score: c.score, from: data.title as string | null, hashtags: c.hashtags };
}
