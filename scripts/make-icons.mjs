// Renders Vidflow's app icons (favicon, Apple, Android, maskable) from lib/brand.ts.
// usage: node --experimental-strip-types scripts/make-icons.mjs
import { chromium } from "playwright";
import { iconSvg } from "../lib/brand.ts";

const out = [
  { path: "app/icon.png", size: 64, rounded: true },
  { path: "app/apple-icon.png", size: 180, rounded: false }, // iOS rounds the corners itself
  { path: "public/icon-192.png", size: 192, rounded: true },
  { path: "public/icon-512.png", size: 512, rounded: true },
  { path: "public/icon-maskable.png", size: 512, rounded: false, inset: 0.3 }, // safe zone for Android masks
];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage();
for (const o of out) {
  await p.setViewportSize({ width: o.size, height: o.size });
  await p.setContent(`<html><body style="margin:0;background:transparent">${iconSvg(o)}</body></html>`);
  await p.locator("svg").screenshot({ path: o.path, omitBackground: true });
  console.log("wrote", o.path, o.size);
}
await b.close();
