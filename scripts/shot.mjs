// Full-page screenshots at phone (390×844) and computer (1440×900) sizes.
// usage: node scripts/shot.mjs <url-path> [name] [outDir]
import { chromium } from "playwright";
const base = process.env.BASE_URL ?? "http://localhost:3000";
const [, , p = "/", name = "page", out = "shots"] = process.argv;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const errors = [];
for (const [label, vp] of [["390", { width: 390, height: 844 }], ["1440", { width: 1440, height: 900 }]]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  page.on("console", (m) => m.type() === "error" && errors.push(`[${label}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${label}] ${e.message}`));
  await page.goto(base + p, { waitUntil: "networkidle" }).catch(() => {});
  // scroll through to trigger reveals
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}-${label}.png`, fullPage: true });
  await page.close();
}
await browser.close();
console.log(errors.length ? "CONSOLE ERRORS:\n" + errors.join("\n") : "no console errors");
