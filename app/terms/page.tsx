import type { Metadata } from "next";
import Script from "next/script";
import { Legal } from "@/components/legal";
export const metadata: Metadata = { title: "Terms", description: "The simple rules for using Vidflow." };
export default function Page() {
  return (
    <Legal title="Terms" updated="November 24, 2026">
      <Script src="https://kwop.io/flow.js" data-site="s_7eb31daa9a" strategy="afterInteractive" />
      <p>Vidflow turns long videos into short vertical clips with AI. By using it you agree to these terms.</p>
      <h2>Your content</h2>
      <p>Only use videos you own or have the right to use. You keep all rights to your videos and clips. You give Vidflow permission to process them only to make your clips. Vidflow never downloads videos from YouTube: to export a clip, you add your own copy of the video, and it is processed on your device.</p>
      <h2>Free try and plans</h2>
      <p>You can try Vidflow for free (3 videos a day, the first clip of each open). Paid plans renew automatically every month or year until you cancel. Each plan has a monthly number of videos; unused videos don&apos;t roll over. Prices are in USD.</p>
      <h2>Payments and cancelling</h2>
      <p>Payments are processed by Whop through Kwop. You can cancel anytime in Account → Billing; you keep your plan until the end of the period you paid for.</p>
      <h2>AI results</h2>
      <p>Clips, scores and captions are made by AI and can contain mistakes. Check a clip before you post it. Virality scores are estimates, not promises of views.</p>
      <h2>Fair use</h2>
      <p>Don&apos;t abuse the service, try to break it, or use it for anything illegal or hateful. We can suspend accounts that do.</p>
      <h2>Contact</h2>
      <p>Questions? Reach us through the Vidflow page on Kwop.</p>
    </Legal>
  );
}
