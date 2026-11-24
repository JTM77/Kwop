import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.id || !viewer.paid) return NextResponse.json({ error: "upgrade" }, { status: 402 });
  const { ext } = (await req.json().catch(() => ({}))) as { ext?: string };
  const e = ["webm", "ogg", "m4a", "mp3", "wav"].includes(ext ?? "") ? ext : "webm";
  const path = `${viewer.id}/${randomUUID()}.${e}`;
  const { data, error } = await supabaseAdmin().storage.from("audio").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: "server" }, { status: 500 });
  return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl });
}
