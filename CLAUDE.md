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

---

## Build status (keep this up to date)
Done (steps 0–4, most of 6–9 in code):
- Step 0/0b blueprint above; step 0c prices chosen by the owner: **B = Starter $12, Creator $24 (Most popular), Pro $49**, yearly −20 %, saved in Kwop (plan ids 1911/1912/1913).
- Design system, landing page (try-first hero, motion VSL, sections, footer), funnel (try → work → locked clips → sign-up sheet → paywall → in-page Whop checkout through Kwop → unlock film), app (dashboard, upload with in-browser audio extraction, clip studio with captions/b-roll/export/share, settings, account/billing/cancel/delete), auth pages, legal, share pages + OG images, manifest/icons, error pages, middleware (k/plan/utm cookies), Supabase migration with RLS.
- Design choice: dark-only app (the niche's loud black look), light #fafafa sections on the landing page for rhythm.
- B-roll source: Wikimedia Commons (free, CC-licensed, no key, CORS-enabled) instead of a paid stock API.

Remaining (in order):
1. Supabase: the owner ALREADY created project "vidflow" (East US) by hand, ran supabase/migrations/20261124000000_init.sql in the SQL editor, and turned "Confirm email" off. Do NOT create another project: find it with GET /v1/projects (name vidflow), read its keys (GET /v1/projects/{ref}/api-keys), set site_url / uri_allow_list via PATCH /v1/projects/{ref}/config/auth, put URL/anon/service keys in .env.local.
2. Google sign-in steps to the owner (redirect URI https://<ref>.supabase.co/auth/v1/callback), then enable via the Management API and set NEXT_PUBLIC_GOOGLE_ENABLED=1.
3. Verification loop on sign-up/funnel/app with screenshots (scripts/shot.mjs), e2e (tests/e2e.spec.ts, `npx playwright test --trace off`) × 3 on phone + computer.
4. Premium pass, Lighthouse 95+.
5. Vercel project "vidflow", env vars (KWOP_API, Supabase keys, GEMINI_API_KEY, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_GOOGLE_ENABLED), production deploy, Supabase site URL/redirects to the production address.
6. Live test, then POST KWOP_API/connect {"url": "<https://vidflow….vercel.app>"} and check https://kwop.io/vidflow/app.
7. Security pass (RLS check with a second user, no secrets in .next/static, input validation).

Session 2 (2026-11-24):
- Network secret for api.supabase.com re-saved and WORKS. The owner's project is named **"Kwop"** (ref `jccipwrgcorftmxcgsfn`, eu-west-1), not "vidflow"; it has the Vidflow migration (profiles, projects, analysis_cache, RLS on). Use it.
- Keys written to `.env.local` (gitignored). Build, typecheck, lint pass; service key not in .next/static. Landing/login/signup screenshots: no console errors.
- Auth config fixed with the owner's OK: email sign-up ON, auto-confirm ON, site_url + uri_allow_list = localhost for now (add the production URL at step 5).
- BUG FIXED: the project gave NO table privileges to anon/authenticated/service_role (new Supabase default), so the app could not read/write anything. Added and applied `supabase/migrations/20261124120000_grants.sql`. RLS checked with two users: own profile only, other user's row hidden, anon denied, cache server-only. (Step 7's RLS check = done.)
- Sign-up through the UI verified (390 px) → /dashboard, clean console. Test users deleted.
- Local server in the cloud container: start it with `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` or Node's fetch skips the proxy and every Supabase call from the server fails (401 on /api/claim). The "kwop" environment now allows jccipwrgcorftmxcgsfn.supabase.co.
- Vercel: token re-saved and works. Project **vidflow** (`prj_jVnrKM4pVe6pyE2rWWktvcqQfI1f`, team veener-ai) created, Supabase env vars set, deployed: **https://vidflow-seven-nu.vercel.app**. Deploy: `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx vercel deploy --prod --yes --token proxyinjected` (the proxy injects the real token; the placeholder must not contain "-"). Supabase site_url/allow list = production + localhost. Live landing + sign-up verified, test users deleted.
- GEMINI_API_KEY (from the kwop environment variable after a restart) added to Vercel + .env.local. BUG FIXED in lib/ai.ts: the newest Flash model (gemini-3.8-flash) kept answering "high demand" → every try failed. Now tries the 3 newest Flash models then gemini-2.5-flash. A try takes ~2 min.
- Live e2e (phone) passes through: try → clips ready → locked teaser → "Save your clips" sign-up → paywall; fails only at prices ("/ day") because KWOP_API is not set. Test users deleted.
- KWOP_API found (in the owner's "Build my software" message; value only in .env.local + Vercel, never commit it). GET answers the 3 plans (B prices). Live: paywall shows real plans + per-day prices; Whop checkout opens inside the sheet ("Subscribe to Vidflow $24.00"; card fields show "Unavailable" only in the cloud container, whose network blocks Whop's card vault). Fix: if Whop's script is blocked, go to fallback_url instead of an error. Live e2e (phone) passes end to end.
- **Connected to Kwop**: POST /connect → ok, app_url = https://vidflow-seven-nu.vercel.app; https://kwop.io/vidflow/app → 302 to the app. Secret scan of .next/static clean.
- Test account kept for the owner: vf-ck-1795524427@example.com / Test-pass-12345 (free, no plan).
- Google sign-in ON: owner made Google Cloud project "Vidflow" (their auto-created project applied-arena-5wh4c lacked OAuth permissions), client id 360515116496-poeo…; enabled via Management API, NEXT_PUBLIC_GOOGLE_ENABLED=1 on Vercel. Live button goes to Google with the right client_id and redirect_uri. Owner must still click "Publish app" on console.cloud.google.com/auth/audience.
- Remaining: premium pass + Lighthouse 95+ (step 4) not run this session. Free tries are 3/day per device, 6/day per IP: e2e from the cloud container can only run ~3 times a day.
- (History) KWOP_API candidates that are NOT it: business id `biz_f68pDVyF8dvyQc` (no path answers), `https://kwop.io/vidflow` (the public Kwop landing page), `/api/v2/pub/vidflow` (Kwop page's public browser API, POST only; no GET plans, no /plan?email). Need the private server API link from the Kwop dashboard. Google sign-in (step 2) not started.

Blocker hit in the first cloud session: the network-proxy credentials for api.supabase.com / api.vercel.com were rejected ("JWT could not be decoded" / invalidToken) even after fresh tokens. Next session: the owner adds SUPABASE_ACCESS_TOKEN / VERCEL_TOKEN / GEMINI_API_KEY as environment variables of the "kwop" environment (from a computer: claude.ai/code → kwop → Edit). Use them directly (Supabase Management API + `npx vercel --token $VERCEL_TOKEN`). The owner is on a phone often and finds manual steps too long: do everything yourself, ask only for what is unavoidable.
