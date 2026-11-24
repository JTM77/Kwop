# Vidflow — project memory

Vidflow is a SaaS for **faceless content creators building an audience** (US market, English, USD).
Long video or podcast in → AI finds the best moments → vertical clips with kinetic captions and b-roll, ready for TikTok / Reels / Shorts.
Built with the Kwop method (premium "Kwop Builder" level). Payments, plans and the owner dashboard go through **Kwop** (never Whop directly).

> The owner is not a developer. Never ask product/design questions: decide like the best apps of the niche and write the decision here.

## RESULT
**RESULT = "your clips"** (e.g. "Your 10 clips are ready.").
It names the main button ("Find my clips"), the creating screen ("Finding your clips…"), the paywall title ("Your 10 clips are ready.") and events.

---

## Step 0 — what already converts (research, Nov 2026)

### Opus Clip (opus.pro) — the model we follow for structure and flow
- Landing: headline "1 long video, 10 viral clips. Create 10x faster." Hero = a big input "Drop a video link" + "Get clips in 1 click" button, upload option under it. Sections in order: hero input → product video of clips → features (AI clipping, virality score, captions, reframe, b-roll) → social proof → use cases → FAQ → final CTA.
- Sign-up: asked right after you paste a link (Google first, email under it).
- Steps to first result: paste link → pick clip length / genre → processing screen with progress → grid of clips sorted by "virality score".
- Paywall: free plan exists (60 credits/mo, watermark, clips expire after 3 days); upgrade prompts when credits run out or on export without watermark.
- Plans (2026): Free (60 credits), Starter $15/mo (150 credits, monthly only), Pro $29/mo or $14.50/mo yearly (300 credits / seat pack), Business custom. 1 credit = 1 minute of uploaded video.

### Klap (klap.app)
- Landing: "Turn videos into viral shorts" + paste YouTube link in hero. Sign-up before processing.
- Plans: Basic ~$23–29/mo (100 clips/mo, source up to 45 min), higher tiers up to ~$151/mo. Counts generated clips, no free tier.

### CapCut (capcut.com) — checked: it is a general editor, not a "long video → clips" tool
- Landing: "All-in-one video editor". Sign-up before the editor. Has "Long video to shorts" as one feature among hundreds.
- Plans: Pro ~$7.99–$19.99/mo depending on region/billing; free tier with limits (captions capped, watermark on some features).
- Verdict: CapCut does the job only partially (manual editor). Replaced as direct competitor by **Klap** and **Vizard** (Creator ~$29/user/mo).

**Model picked: Opus Clip** (paste a link in the hero → clips). Applied on top: Kwop rules (no price on landing, try first, blurred teaser, paywall at the peak, in-page checkout, per-day prices).

Sources: castmagic.io/blog/opus-clip-pricing, creatify.ai opusclip pricing 2026, klap.app/alternatives/vizard-ai, xpay.sh/saas-pricing/klap-app, activepieces CapCut Pro 2026, bigvu CapCut free vs pro 2026.

---

## Step 0b — Vidflow's blueprint

### Funnel type: TRY FIRST — and why
A creator already has the long video (a YouTube upload, a podcast episode). Pasting a link is 1 tap with an example chip, the AI works on the real video, and they see their own clip #1 playing in a phone frame before any account. That is the strongest aha in this niche (Opus Clip proves the paste-a-link hero).

### What the engine really does (honest web version)
- **Analyze**: Gemini (lib/ai.ts, newest Gemini Flash) watches a **public YouTube link** directly (Gemini accepts YouTube URLs) or a pasted transcript/script, and returns 10 clips: title, hook line, start/end time, virality score 0–100 with the reason, caption lines with timing, b-roll keywords, hashtags.
- **Preview**: each clip plays in a 9:16 phone frame (YouTube embed cued at start→end, center-cropped) with Vidflow's kinetic captions drawn on top, live.
- **Export (paid)**: the creator drops **their own video file** in Upload (the same video they own). The browser renders each clip in 1080×1920: center crop, kinetic captions burned in, b-roll cut-ins (Smart B-Roll from Pexels stock footage), and downloads an MP4/WebM. Nothing is uploaded to our servers except the audio track for analysis. YouTube videos are never downloaded (not allowed) — said plainly in the app.

### The hero (first 10 seconds)
- Title (≤8 words): **"1 podcast in. 30 faceless TikToks out."** Second line in grey gradient: "In about 2 minutes."
- Sub: "Paste a YouTube or podcast link. Vidflow finds the **viral moments** and adds **kinetic captions** for you."
- The input: a big pill field "Paste a YouTube link…" + button **"Find my clips →"**.
- 3 example chips under it (real public videos): "🎙 Podcast", "📚 Storytime", "💰 Finance tips" → one tap fills the link and starts (lucide icons, not emoji).
- Under: mono line "Free to try · No card · Clips in ~60 seconds".
- Right side (computer) / below (phone): a phone frame looping a faceless clip with kinetic captions and a view counter ticking — the magic moment.

### Screens of the funnel, in order, with copy
1. **Hero input** → "Find my clips →".
2. **The work** (in place, under the hero, scrolls into view): title "Finding your clips…", steps ticking: "Watching your video" → "Writing the transcript" → "Scoring every moment for hooks" → "Cutting 10 clips" → "Timing kinetic captions" → "Matching b-roll". Percentage counts to 99 % and holds until Gemini answers (min 3 s). Retry once, then "This video didn't work. Try another link." + "Try again".
3. **"Your 10 clips are ready."** + success burst.
4. **Teaser (RESULT locked)**: Clip #1 in clear: playing in the phone frame with captions, its title, hook, virality score bar ("92 · Strong hook in the first 2 seconds"). Clips 2–10: cards with their score visible, title + thumbnail blurred, lock icon. Tabs above the phone for caption styles: "Bold Pop" (open) · "Karaoke" · "Neon" · "Typewriter" · "Minimal" · "Beast" (locked tabs with a lock).
5. Unlock button: **"Unlock all 10 clips"** → if no account: sign-up sheet titled **"Save your clips"** (Google first) → paywall right away, clips still blurred behind.
6. **Paywall** (sheet): "Your 10 clips are ready." + personal line "From “<video title>” · best moment scored <score>/100." → plans → checkout sheet (Whop embedded) → unlock film → clips unblur in place.

### Clear vs blurred
- Clear: clip #1 (video + captions + score + hook), every clip's virality score, the count of clips, the video title.
- Blurred: titles/hooks/thumbnails of clips 2–10, other caption styles, export buttons, b-roll.

### Sign-up moment
Only when they tap "Unlock all 10 clips" (or a locked clip/tab). Headline "Save your clips". The try is stored with a local id (cookie `vf_try`) and attached to the account at sign-up.

### Paywall
- Title: "Your 10 clips are ready."  Personal line: "From “<title>”. Your best moment scored <score>/100."
- Unlock words: "Unlock all 10 clips" · sticky bar "Unlock all 10 clips · $0.80/day".

### Plans (tags, quotas, what you unlock) — quotas counted on the server per billing period
Unit = **videos analyzed a month** (each gives up to 10 clips) + max source length.
| Plan | Tag | Videos / month | Clips | Max video length | Caption styles | Smart B-Roll | Export | History |
|---|---|---|---|---|---|---|---|---|
| Starter | For your first faceless channel | 4 | up to 40 | 45 min | 2 (Bold Pop, Minimal) | locked (blurred preview) | 720p | 30 days |
| Creator (Most popular) | For posting every day | 15 | up to 150 | 2 h | all 6 | yes | 1080p | 1 year |
| Pro | For running several channels | 40 | up to 400 | 3 h | all 6 + brand colors | yes | 1080p 60fps, priority | forever |
Tries without an account: 3 a day per device and per IP (server).
(Final prices: chosen by the owner at step 0c, stored in Kwop, always read from GET KWOP_API.)

### Magic moment on the landing page
A CSS iPhone frame playing a faceless clip: animated gradient "b-roll" scenes drawn in SVG/CSS, kinetic captions popping word by word in #C8FF3D, a TikTok-style side rail with a view counter ticking up (example values, labeled as a preview).

### Visual direction (Content creation: loud and bold)
- Background #060606, dot grid over hero, one hot glow at top center. Light sections #FAFAFA alternate.
- Brand/main: **#C8FF3D** (acid lime). Hot gradient accent: #FF3D7F → #FF8A3D (hot pink to orange), used in glows and the "viral" score bars. Ink #0A0A0A, greys #A1A1AA / #52525B, borders rgb(255 255 255 / 9%).
- Fonts: **Space Grotesk** (titles + UI), **JetBrains Mono** (labels, timestamps, counters).
- 3 signature elements: (1) 9:16 phone frames playing clips with kinetic word-by-word captions, (2) timeline/waveform strip with the cut points highlighted, (3) virality score meters + view counters that tick.

---

## Tech
Next.js App Router + TypeScript + Tailwind + shadcn/ui-style components + framer-motion + lucide-react. Supabase (Postgres + Auth, RLS on every table, SQL in supabase/migrations). Vercel free plan. AI only through `lib/ai.ts` (Gemini).

## Kwop API (server only)
`KWOP_API` env var (in .env.local and Vercel, never in browser code, never committed).
- GET KWOP_API → { name, checkout, plans: [{ id, name, price_cents, currency, interval, per_day, yearly }] }
- POST /checkout {plan, period, email, k?} → { embed, ref, fallback_url } (409 payments_off)
- POST /confirm {ref} → { ok, paid }
- GET /plan?email= → { paid, plan, status, until } — only via getPlan(email) in lib/kwop.ts, 60 s cache.
- POST /cancel {email, except_ref?} → { message, manage_url? }
- POST /event {type, email, detail?} fire-and-forget: signup, onboarding_done, aha, paywall_view, feature_used
- POST /connect {url} once online.
- `?k=` tracked link → cookie kwop_k (30 d) → profiles.k → sent in every checkout.
- Visit tracking script on public pages only: https://kwop.io/flow.js data-site="s_7eb31daa9a".

## Verification loop (after every feature)
npm run dev → scripts/shot.mjs screenshots at 390×844 and 1440×900 → look at them → console must be clean → fix → 3 passes → commit. tests/e2e.spec.ts covers the full funnel (never pays).
