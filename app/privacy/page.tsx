import type { Metadata } from "next";
import Script from "next/script";
import { Legal } from "@/components/legal";
export const metadata: Metadata = { title: "Privacy", description: "What Vidflow keeps, and why." };
export default function Page() {
  return (
    <Legal title="Privacy" updated="November 24, 2026">
      <Script src="https://kwop.io/flow.js" data-site="s_7eb31daa9a" strategy="afterInteractive" />
      <p>Short version: we keep what we need to make your clips, nothing more, and we never sell it.</p>
      <h2>What we keep</h2>
      <p>Your email and login, your settings (caption style, brand color), the links or scripts you submit, the clips the AI found (titles, timings, captions) and your usage (how many videos this month). For free tries without an account we keep a random device id and a hashed IP to limit tries.</p>
      <h2>Your videos</h2>
      <p>Video files stay on your device. When you upload a file, only a small audio track is sent to the AI to find the moments, and it is deleted right after.</p>
      <h2>Services we use</h2>
      <p>Supabase (database and login), Vercel (hosting), Google Gemini (the AI that watches your video or audio), Wikimedia Commons (free b-roll footage), Whop through Kwop (payments — we never see your card), and visit analytics by Kwop on our public pages.</p>
      <h2>Your choices</h2>
      <p>You can delete any video in Clips, and delete your whole account with all its data in Account → Delete my account.</p>
    </Legal>
  );
}
