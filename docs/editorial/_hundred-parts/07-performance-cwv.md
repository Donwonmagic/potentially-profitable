## Domain VII — Performance & Core Web Vitals

> Positioning Council batch, Domain VII (briefs 49–55). Strategy only — no live-site edits. Every number is repo-sourced (cited to file), web-sourced (labeled + dated), or marked *illustrative / analyst assessment*. No Lighthouse/CWV field number below is presented as measured unless it is quoted from `lighthouserc.js` (PR #243 lhci run, median of 3, 2026-05-03). Operator bio is singular throughout. Slugs are treated as final-forever; no rename is ever proposed.

**Asymmetric thesis for the domain.** The operator reads this on a cheap phone, on bad restaurant wifi, mid-shift. A static, no-framework, zero-third-party-JS site on Cloudflare's edge can be *faster and more resilient* than any JS-heavy SaaS (Toast/Wix/Yelp), and a giant cannot strip its own tracking/ads/framework to catch up. Speed + offline resilience **is** the positioning, not a footnote to it.

**Repo baseline (the honest starting line).** lighthouserc.js records the only measured numbers we have — PR #243 lhci, mobile, Slow 4G + 4× CPU, median of 3, 2026-05-03: perf **0.73–0.79**, LCP **4.4s–6.0s** (worst 5953ms on `/`), CLS **0.00–0.07**, 1 render-blocking resource (the single legacy `site.css`), a11y gate ≥0.95, SEO gate =1.00. Launch-plan targets sit commented in the same file: perf ≥0.90, LCP ≤2000ms, CLS ≤0.05, TBT ≤200ms, bootup ≤1500ms, render-blocking =0. The architecture to *hit* those targets already shipped (CSS shell split, font preload + fallback metrics, AVIF/WebP pipeline, lazy JS loader); the gate just hasn't been re-measured and re-tightened. **That gap — built but not re-measured — is the through-line of this domain.**

---

### 49 · Performance Engineer (CWV)

**Aspect & why it decides success.** LCP/INP/CLS at p75 mobile is the rank-and-trust substrate: it gates the SEO the whole studio runs on, and it is the one axis where a one-person static shop can provably out-perform a national SaaS. If the operator's own phone renders this faster than the Toast site next door, the pitch closes itself.

**Current-state audit — 7/10.** Strong bones, stale measurement. The async-CSS swap, four-font preload with `size-adjust`/`ascent-override` fallback faces (`tools/margin-math/index.html` head, lines 84–146), and `requestIdleCallback` JS deferral (`scripts/inject-lazy-script-loader.mjs`) are exactly the right LCP/INP moves. But the *enforced* gate in `lighthouserc.js` is still the "do-not-regress" baseline (perf ≥0.70, LCP ≤6500ms) — the build passes at 4.4–6.0s LCP. INP is **not gated at all** (Lighthouse lab uses TBT ≤800ms as a proxy; `lighthouserc.js` lines 126). web.dev sets the p75 pass bars at LCP ≤2.5s, **INP ≤200ms**, CLS ≤0.1 (web.dev, "Core Web Vitals," current as of 2026-01; INP replaced FID as a Core Web Vital on 2024-03-12). We are gating to ~2.6× the LCP target and not watching the metric Google now counts.

**Benchmark gap (Toast / BentoBox restaurant sites).** Restaurant-SaaS template sites routinely ship third-party tag managers, chat widgets, and hydration bundles that push mobile LCP past 4s and INP past 200ms in the field. Our floor is *structurally* lower because there is no third-party script on the critical path (`scripts/check-no-third-party-plausible.mjs` makes that a CI invariant). The gap is that we don't *prove* it — no field data, no CrUX, no public scorecard.

**The Extend-Past move.** Stop gating to yesterday's baseline and publish the result. Re-measure with the shipped optimizations, tighten `lighthouserc.js` to the commented launch targets, and surface the score as a positioning asset ("measured on a throttled phone, here's the number") that a SaaS literally cannot replicate without removing its own revenue tags.

**Actions.**
1. Re-run lhci on the current Pages preview; record fresh median-of-3 in a dated comment in `lighthouserc.js`. **S × 5** — unblocks every other decision in this domain.
2. Tighten the enforced block toward targets in one step the new run supports (start LCP ≤4000ms, TBT ≤500ms; ratchet from there). **S × 4**
3. Add a field-data INP guard: a tiny inline `PerformanceObserver` that pipes the existing Plausible custom-event channel (`/api/event`, already same-origin) a bucketed INP rating only — never raw timings, PII-clean. **M × 4**
4. Promote `render-blocking-resources` from `warn` to `error` once the legacy single-`site.css` path is confirmed dead in `dist/` (shells already split). **S × 3**
5. Add a CrUX/PageSpeed snapshot to the deploy log via the PSI proxy the site already runs (`/api/psi`, `wrangler.jsonc`). **M × 3**

**Risks & honesty-gate notes.** Do **not** publish a "Lighthouse 100" or specific CWV badge until a fresh run measures it — current honest numbers are 0.73–0.79 perf / 4.4–6.0s LCP (`lighthouserc.js`). Ratchet gates gradually or you wedge CI on an un-fixed metric. INP beacon must ship bucketed ratings only to stay inside the `/never/` privacy contract.

**One proof metric.** p75 mobile **INP ≤ 200ms** and **LCP ≤ 2.5s** on the lighthouserc URL set (web.dev pass bars), measured — not assumed.

---

### 50 · Critical-Path / CSS Specialist

**Aspect & why it decides success.** First paint on a $50 phone on 3G is the whole "faster than the giant" claim made literal. Critical CSS, font strategy, and cache-busting decide whether the operator sees text in <1s or stares at a white screen on the line.

**Current-state audit — 8/10.** Best-in-class for the category. `scripts/build-css-shells.mjs` partitions the 6,342-line monolith into core/tool/article shells via in-file `@shell:` markers, with a round-trip + cascade-safety gate (`scripts/check-css-shells.mjs`: rule-multiset equality, no selector in core *and* a supplemental shell, build-freshness — all fail-CI). Production ships minified shells via lightningcss in `dist/` (`scripts/minify-css.mjs`, header claims ~60–65% reduction; *that 60–65% is the script's own stated expectation, not an independently measured figure*). Critical CSS (~600 bytes, per the head comment) is inlined; the main shells load via `<link rel="preload" … onload="this.rel='stylesheet'">` with a `<noscript>` fallback (`tools/margin-math/index.html` lines 140–146). Fonts: variable Fraunces + Inter woff2 preloaded with `Fraunces Fallback`/`Inter Fallback` metric-matched faces (lines 87–92) — a genuine CLS-killer. Cache posture is deliberate: CSS/JS on 1-day TTL + 7-day stale-while-revalidate because filenames aren't fingerprinted, fonts on 30-day immutable because the woff2 names embed a version stamp (`_headers` lines 50–60).

Real shell sizes today (raw / gzip, pre-minify, measured via `wc -c` + `gzip -c`): site-core 244KB / **61.5KB**, site-tool 41KB / **10.4KB**, site-article 177KB / **41.8KB**. A tool page ships core+tool (~72KB gz pre-minify); an article ships core+article (~103KB gz pre-minify). Minification in `dist/` cuts this further but is *not* separately measured here.

**Benchmark gap (Google web.dev "Extract critical CSS" guidance).** Google/Cloudflare recommend inlining only above-the-fold CSS and deferring the rest — which the site does. The gap is *core shell heft*: 61.5KB gz of "every page needs this" is large for a critical-adjacent payload, and the inline critical block is hand-maintained (~600 bytes) rather than route-extracted.

**The Extend-Past move.** Shrink the core shell from "everything shared" toward "everything *above the fold* shared," and let `content-visibility` defer the rest of the render cost (see brief 54). The async swap already prevents render-blocking; the next win is parse/layout cost of a 61.5KB core, not download.

**Actions.**
1. Audit `@shell:core` sections for rules only ever used below the fold or on one template; reclassify into tool/article shells (cascade gate protects you). **M × 4**
2. Add a `--check` size-budget assertion to `check-css-shells.mjs` (e.g. fail if core gz > 60KB) so the core shell can't silently bloat. **S × 4**
3. Generate the inline critical block from a route-level extraction step rather than hand-curation, keyed off the existing `inject-critical-*` scripts. **L × 3**
4. Verify `dist/` minified shell sizes in the deploy log and record them once, so the "60–65%" claim becomes a measured number, not an estimate. **S × 3**

**Risks & honesty-gate notes.** The shell round-trip invariant only holds on *unminified* `assets/` source — never minify in place; `minify-css.mjs` correctly operates on `dist/` only. The "~60–65% reduction" and "~600 byte critical CSS" are the scripts'/comments' own figures (`minify-css.mjs` header; `tools/margin-math/index.html` line 53) — labeled as such, not independently verified here.

**One proof metric.** First Contentful Paint **< 1.5s** on emulated 3G / 4× CPU (Lighthouse), with core-shell gzip held **≤ 60KB** by the new budget gate.

---

### 51 · Image / Media Optimizer

**Aspect & why it decides success.** On a restaurant site ~80% of bytes are images (`scripts/check-lazy-images.mjs` header). Zero CLS and the smallest payload in the category is a category-defining claim — and the cheapest LCP win available.

**Current-state audit — 8/10.** The pipeline is real and gated three ways. `scripts/build-image-formats.mjs` encodes AVIF (q50) + WebP (q75) siblings for every PNG/JPG (~33MB raster inventory, 18 sources per its header; the bio portrait alone is 5.8MB pre-encode), `--check` mode fails CI if any sibling is missing and needs no `sharp` at deploy time. `scripts/check-image-dimensions.mjs` is **fail-CI** (`WARN_ONLY=false`, line 36) — every shipping `<img>` carries width+height or an aspect class, the single highest-leverage CLS fix. `scripts/check-lazy-images.mjs` is **fail-CI** too — below-fold images must carry `loading="lazy"` + `decoding="async"`. `<picture>` wrapping is injected by `inject-picture-tags.mjs` (in the build chain, `wrangler.jsonc`). The measured CLS baseline already reflects this: **0.00–0.07** (`lighthouserc.js`), and `unsized-images` / `image-aspect-ratio` are strict gates.

**Benchmark gap (Vercel / Cloudinary responsive image delivery).** Vercel/Cloudinary serve *per-request* device-width-resized images via a URL transform layer. We ship pre-built AVIF/WebP at source resolution — smaller format, but not per-viewport `srcset` width descriptors. A 5.8MB source portrait re-encoded is still one size for a 360px phone and a 1440px desktop. No measured `fetchpriority="high"` on the LCP image either (`grep` of `tools/margin-math/index.html`: 0 hits).

**The Extend-Past move.** Add responsive `srcset`/`sizes` width variants to the static pipeline (build-time, not edge-runtime) so a $50 phone downloads a phone-sized hero — matching Cloudinary's *outcome* with zero runtime cost and zero third-party dependency. Then mark the LCP image `fetchpriority="high"`.

**Actions.**
1. Extend `build-image-formats.mjs` to emit 2–3 width variants (e.g. 480/960/1440) per source and have `inject-picture-tags.mjs` write `srcset`+`sizes`. **L × 5**
2. Add `fetchpriority="high"` to the single above-the-fold LCP `<img>`/`<source>` per page (small, surgical). **S × 4**
3. Add a `--check` byte-ceiling to `build-image-formats.mjs` (fail if any shipped AVIF > N KB) so a re-added 5.8MB-class source can't regress LCP. **S × 4**
4. Confirm AVIF/WebP `Content-Type` is served correctly from `dist/` (image `_headers` rules are by directory, not extension — verify the encoded siblings inherit a sane cache). **S × 3**

**Risks & honesty-gate notes.** CLS 0.00–0.07 is *measured* (`lighthouserc.js`); the "80% of bytes are images" and "~33MB / 18 sources / 5.8MB portrait" figures are the scripts' own headers — labeled, not re-counted here. Width-variant generation multiplies committed binary count; keep the mtime-skip in `build-image-formats.mjs` so re-runs stay fast.

**One proof metric.** Largest hero **transfer ≤ 100KB** on a 360px viewport (AVIF, smallest width variant), CLS held **≤ 0.05**.

---

### 52 · Edge / CDN Architect

**Aspect & why it decides success.** Sub-100ms TTFB worldwide is the part of "faster than the giant" a one-person shop gets *for free* from Cloudflare's edge — but only if caching, headers, and the Worker fall-through are tuned so the edge actually serves cached HTML instead of waking the Worker on every hit.

**Current-state audit — 7/10.** Deployed on Cloudflare Workers Static Assets (`wrangler.jsonc`: `main: ./src/worker.js`, `assets.binding: ASSETS`, `run_worker_first: true`). HTML carries `s-maxage=3600` edge cache + `stale-while-revalidate=86400` (`_headers` lines 155–165); static assets get long immutable caches; security headers (HSTS preload, tight CSP, `X-Frame-Options: DENY`, `interest-cohort=()`) apply to every response. `observability.enabled` is on. Per-locale `Content-Language` is set with correct rule ordering. The retired tools return HTTP 410 via `_redirects` (3 rules).

The friction: **`run_worker_first: true`** means the Worker is invoked ahead of the asset server for *every* request, not just `/api/*`. The Worker then falls through to `env.ASSETS.fetch()` for non-API paths — correct, but it puts JS execution in front of every static HTML hit, which can erode the pure-edge TTFB the architecture promises. A `*/5` cron and Durable-Object rate limiter add steady-state account activity but don't touch request TTFB.

**Benchmark gap (Cloudflare / Fastly edge-cache best practice).** Cloudflare's own guidance is to let Static Assets serve cacheable routes directly and reserve the Worker for dynamic paths (Cloudflare Workers docs, "Static Assets" + `run_worker_first`, current as of 2026-01). Fastly's model is similarly "compute only when you must." Running the Worker first on every request is the opposite default.

**The Extend-Past move.** Make the static path *pure edge* — scope Worker-first execution to `/api/*` (and the few flagged dynamic surfaces) so HTML/CSS/JS/fonts are served by Static Assets without a Worker hop, then prove a sub-100ms cached TTFB. A SaaS origin-server stack cannot match an edge-cached static asset's TTFB.

**Actions.**
1. Evaluate scoping `run_worker_first` to API/dynamic routes only (Cloudflare supports route-scoped worker-first); keep `env.ASSETS` fall-through for everything else. **M × 5**
2. Add a deploy-time TTFB probe (curl `-w '%{time_starttransfer}'` against the Pages preview for `/`, an article, a tool) and log it. **S × 4** — converts "sub-100ms" from claim to measurement.
3. Confirm HTML `s-maxage=3600` is actually honored at the edge for cacheable GETs once worker-first is scoped (the cron/DO traffic shouldn't bust HTML cache). **S × 3**
4. Document the edge-cache + SWR posture as a public resilience claim only after the TTFB probe confirms it. **S × 3**

**Risks & honesty-gate notes.** "Sub-100ms TTFB worldwide" is currently an **architectural target, not a measured value** — no TTFB number exists in the repo. Changing `run_worker_first` touches the request path for the whole site; validate `/api/*`, forms, and the Window flows on a preview before merge. Don't claim a global TTFB figure without multi-region measurement.

**One proof metric.** Edge-cached **TTFB < 100ms** (cache HIT) for a static HTML route, measured from at least two regions.

---

### 53 · JS-Budget Minimalist

**Aspect & why it decides success.** The tools are the studio's main JS surface and its lead magnet; the asymmetric bet is "rich client-side tools at near-zero JS tax." If the tools stay rich but the bytes/main-thread cost stays low, we get islands-architecture outcomes with no framework and no hydration.

**Current-state audit — 8/10.** Already an islands architecture in spirit, hand-rolled. Site-wide JS is lazy: `assets/site.js` (64KB raw / **19.6KB gz**, measured) and `assets/p.js` (6KB) load via `requestIdleCallback` *after* the `load` event (`scripts/inject-lazy-script-loader.mjs`), directly fixing the "page renders but I can't tap anything for seconds" main-thread-block symptom its header describes. Tool logic is per-page and modest: `tools/margin-math/margin-math.js` is 27KB / **8.6KB gz** plus `cascade.js` 8.6KB. No framework, no hydration runtime, no third-party script on the critical path (CI-enforced by `check-no-third-party-plausible.mjs`). Tools are deliberately unminified and View-Source-readable as a privacy proof (margin-math JSON-LD FAQ, `tools/margin-math/index.html` line 41).

The watch-item: `tools/_shared/` is large and growing — `cost-index-ui.js` alone is **63.9KB raw**, and several cost-* modules are 13–25KB. Whether a given tool page pulls one or many of these decides its real JS budget. There is **no enforced per-page JS-byte gate** (Lighthouse `bootup-time` ≤4000ms / `mainthread-work-breakdown` ≤6000ms in `lighthouserc.js` are generous regression catches, not budgets).

**Benchmark gap (Astro / Svelte islands).** Astro ships zero JS by default and hydrates only interactive islands; Svelte compiles components to small imperative JS (Astro docs "Islands architecture"; Svelte docs — both current as of 2026-01). Our hand-rolled equivalent matches the *philosophy* but lacks their tree-shaking and per-route budget enforcement — a tool that imports five `cost-*` modules has no guardrail.

**The Extend-Past move.** Keep the no-framework, readable-source posture (it's a privacy feature a framework can't offer) and bolt on the *one* thing frameworks give you that we lack: an enforced per-page JS-transfer budget, plus on-demand `import()` so a tool only pays for the modules it actually runs.

**Actions.**
1. Add `check-js-budget.mjs` to the check-all chain: sum the JS a page references, fail if transfer-est exceeds a per-template ceiling (e.g. tool ≤ 60KB gz incl. shared). **M × 5**
2. Convert heavy optional `tools/_shared/*` modules (e.g. `cost-index-ui.js` 63.9KB) to dynamic `import()` fired on first interaction, not at parse. **L × 4**
3. Tighten `bootup-time`/`mainthread-work-breakdown` in `lighthouserc.js` toward the commented targets (1500ms / 2500ms) once #1 holds. **S × 3**
4. Keep tools unminified for View-Source auditability, but gzip is what ships — document the raw-vs-gz distinction so "small JS" claims cite gz. **S × 3**

**Risks & honesty-gate notes.** The lazy-load `requestIdleCallback` pattern delays interactivity by design — fine for analytics/site chrome, but verify tool *inputs* themselves aren't gated behind the idle callback on the heaviest tool. JS sizes above are repo-measured raw + gz; don't quote raw as the "download cost." No INP field number is claimed.

**One proof metric.** Per-page JS **transfer ≤ 60KB gz** (tool template, shared included), enforced by a fail-CI budget gate.

---

### 54 · Mobile-Performance Specialist

**Aspect & why it decides success.** The operator *is* on a phone, on the line — this is the literal use-case, not a persona. "Native-app feel without an app" (instant taps, no layout jump, install-to-home-screen) is the difference between a tool used mid-shift and a tab closed in frustration.

**Current-state audit — 7/10.** The mobile fundamentals are in place: viewport meta, fixed-nav min-height reservation in critical CSS (`tools/margin-math/index.html` line 70 + 82), Turnstile widget min-height reservation called out in `lighthouserc.js` (lines 109–124) to stop the form CLS, 44px touch targets on actions (`.mm-action{min-height:44px}`, line 314), and a `prefers-color-scheme: dark` block inline so dark-mode users don't flash light (line 132). The lhci gate *is* mobile-first by design (Slow 4G + 4× CPU, the launch plan's explicit scenario). A PWA manifest exists (`brand/favicons/site.webmanifest`: standalone, theme `#1F4E5B`, 192/512 icons, scope `/`) and a no-op service worker (`course/sw.js`) already satisfies iOS "Add to Home Screen" for the bootcamp.

Two gaps. (1) **`content-visibility` is used only in the inline critical block** (`.below-fold-island{content-visibility:auto;contain-intrinsic-size:auto 1200px}`) — `grep` finds **0** occurrences in `assets/site.css` proper, so below-fold render-skipping isn't applied site-wide where it would most help a slow mobile CPU. (2) Install-to-home-screen is scoped to `/course/` only; the tools the operator actually opens mid-shift aren't installable.

**Benchmark gap (PWA leaders — e.g. Starbucks/Twitter Lite-class web apps).** PWA leaders deliver app-shell instant loads + installability across the whole app. We have the manifest and an installability SW, but only the bootcamp is wired, and we don't yet apply `content-visibility` to make long article/tool pages cheap to render on a weak CPU.

**The Extend-Past move.** Extend installability + `content-visibility` from the bootcamp to the *tools* — the surface the operator uses on the line — so Margin Math feels like a home-screen app that paints instantly even on a throttled phone. This is the "native-app feel without an app" claim made real on the highest-value surface.

**Actions.**
1. Apply `content-visibility:auto` + `contain-intrinsic-size` to below-fold sections in `assets/site.css` (article body sections, tool secondary panels), not just the one inline island. **M × 5**
2. Wire the existing no-op SW + manifest to `/tools/*` so tools are installable to home screen (keep it no-op — no fetch caching unless brief 55 lands). **M × 4**
3. Add a maskable PWA icon (`purpose:"maskable"`) to `site.webmanifest` for clean Android adaptive icons. **S × 3**
4. Audit tap targets across tool controls for the 44px floor (already met on `.mm-action`; verify sliders/segmented buttons). **S × 3**

**Risks & honesty-gate notes.** `content-visibility` can shift the scrollbar / break in-page anchor jumps if `contain-intrinsic-size` is mis-estimated — test with the H2-anchor links the build injects. Installability ≠ offline: do not imply the tools work offline by making them installable; that claim belongs to brief 55 and must stay aligned with `data/security-claims.json`. The no-op SW posture is deliberate (`course/sw.js` header) — keep it no-op until 55 explicitly changes it.

**One proof metric.** Total Blocking Time **≤ 200ms** on the mobile lhci profile for `/tools/margin-math/`, with install-to-home-screen working on iOS Safari + Android Chrome.

---

### 55 · Resilience / Offline Engineer

**Aspect & why it decides success.** Bad restaurant wifi is the named enemy. A tool that *works when the connection doesn't* is the single most defensible position against any cloud SaaS — Toast/Wix/Yelp are useless on a dead connection; a static client-side calculator need not be. This is where "resilience IS positioning" stops being a slogan.

**Current-state audit — 4/10.** This is the domain's biggest opportunity and the prompt's premise needs one correction: a service worker **does** exist, but it is *deliberately a no-op* — `course/sw.js` (and `es/course/sw.js`) has **no `fetch` handler**, caches nothing, and exists only for iOS installability; its header explicitly states "does NOT cache lessons, does NOT serve content offline." So there is **no offline caching layer anywhere on the site**, and that is a documented, intentional posture (cross-referenced in `data/security-claims.json` per the SW header). The good news already banked: the tools are pure client-side math with no `fetch()` on calculation (`tools/margin-math` JSON-LD: "no fetch, no storage, no account") — so *once a tool page is loaded, the math already works offline*. The missing piece is **getting the page to load at all** on a dead connection (the HTML/CSS/JS shell), which today requires a live network request.

**Benchmark gap (Workbox / Google offline patterns).** Google/Workbox's standard is an app-shell precache + stale-while-revalidate runtime caching so the shell loads instantly and offline (web.dev "Offline cookbook" / Workbox docs, current as of 2026-01). We have SWR at the *HTTP edge* (`_headers`) but no *service-worker* runtime cache, so a fully-offline cold load fails.

**The Extend-Past move.** Add a precache-only service worker that caches the static shell (HTML + the three CSS shells + site.js + tool JS + fonts) for the tools and key library pages, so the operator on dead wifi still opens Margin Math and runs the numbers. Crucially: precache static assets *only*, never `/api/*` or analytics — preserving the privacy posture while delivering the resilience claim. This is the move a tracking-funded SaaS cannot copy: it can't cache an app that depends on a live ad/analytics/POS backend.

**Actions.**
1. Replace the no-op `course/sw.js` pattern with a Workbox-style **precache + cache-first-for-static, network-only-for-/api/** SW, scoped first to `/tools/*`. **L × 5** — this *is* the positioning.
2. Update `data/security-claims.json` and the privacy prose *in the same change* so the "no offline cache" claim becomes an accurate "static assets cached for offline; your numbers and analytics never are." **M × 5** (honesty-gate critical)
3. Add an offline fallback page (cached) and an `online`/`offline` status chip on tools so the operator knows the math is running locally. **M × 4**
4. Add a CI check that the SW's precache list never includes `/api/*`, `/assets/p.js`, or PII surfaces — a privacy guard mirroring `check-no-third-party-plausible.mjs`. **M × 4**
5. Version the SW precache by the same content-hash the CSS cache-bust uses, so a stale shell can't pin forever (mirror the `_headers` "1-day TTL because filenames aren't fingerprinted" reasoning). **M × 3**

**Risks & honesty-gate notes.** **Highest honesty-gate stakes in the domain.** A caching SW directly contradicts current public claims ("we deliberately do not pre-cache," `course/sw.js`; "no storage" in margin-math FAQ) — the claim files (`data/security-claims.json`, privacy/never pages) MUST move in the same commit or the site lies about itself. A mis-scoped SW that caches `/api/*` would be a privacy regression *and* could serve stale form/auth responses. SW cache invalidation is the classic footgun — pin to content hashes and `skipWaiting`/`clients.claim` carefully (the existing no-op SW already does both). CSP currently allows `worker-src 'self' blob:` (`_headers` line 309), so a same-origin SW is already permitted.

**One proof metric.** Cold-load `/tools/margin-math/` with the network **fully offline** (DevTools offline) → page renders and a calculation completes, with **zero** request to `/api/*` or analytics.

---

#### Cross-domain dependencies (for the Council synthesis)
- **53 → 54 → 55 are a chain.** The per-page JS budget (53) and `content-visibility` (54) must land *before* the offline SW (55) precaches the shell — otherwise the SW pins an oversized, render-expensive bundle into every operator's cache.
- **55 ↔ Privacy/Trust domain.** The offline-cache move (55) cannot ship without coordinated edits to `data/security-claims.json` and the `/never/` + privacy prose — this is a hard dependency on whichever domain owns the privacy canon, not an isolated perf change.
- **52 ↔ 49.** Scoping `run_worker_first` to `/api/*` (52) is a prerequisite for the sub-100ms edge-TTFB claim that feeds the measured-LCP story (49); both also depend on the same fresh lhci/TTFB measurement pass.
