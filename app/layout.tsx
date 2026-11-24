import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], display: "swap", weight: ["400", "500", "600", "700"] });
const jet = JetBrains_Mono({ variable: "--font-jet", subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500", "700"] });

import { SITE_URL as site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Vidflow — 1 podcast in, 30 faceless TikToks out", template: "%s · Vidflow" },
  description: "Paste a long video or podcast. Vidflow's AI finds the viral moments, adds kinetic captions and b-roll, and hands you vertical clips for TikTok, Reels and Shorts.",
  applicationName: "Vidflow",
  openGraph: { type: "website", siteName: "Vidflow", title: "Vidflow — 1 podcast in, 30 faceless TikToks out", description: "AI finds the viral moments in your long videos and adds kinetic captions and b-roll." },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Vidflow", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#060606", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${grotesk.variable} ${jet.variable}`}>
      <body className="min-h-dvh bg-ink antialiased">{children}</body>
    </html>
  );
}
