# Handoff — the "bolder / more cutting-edge" pass

_Written 2026-06-30 for the next session. Branch: `claude/muntin-strategic-council-fzdd1j`._

## Your mission

Evaluate where **muntin.digital (this repo) is too visually conservative**, and then execute a plan to make it more impressive / cutting-edge — **without breaking the brand covenant or the fact gate**. The founder's words: "being safe is good, but maybe some parts of the website are too restrained." Your job is **evaluation first, then execution**.

The prior pass already made the **Cost Index tool** (`/tools/cost-pulse/`) "futures-edge" (Fraunces hero figure, confidence-as-material, elevation depth, a then-vs-now divergence wedge, restrained one-time motion). **The rest of the site did not get that treatment** — that's the opening.

## The tension you must hold (read this twice)

The brand's identity is **calm, trustworthy, editorial — "a precision instrument on a clean worktop, not a fintech dashboard that twitches."** Every honesty gate exists because the prose is **read aloud in EN + ES**, so a fabrication gets spoken. "More flashy" must mean **more craft and confidence**, not glow/neon/motion-for-its-own-sake. The founder has twice said "without being too gratuitous." Push the ceiling on *impressiveness*; do not trade away *trust or calm*. When a flourish reads as fintech-cl: kill it.

## Hard constraints (non-negotiable — do not relitigate)

- **Fact gate is absolute.** Every number/date/name/percentage must be (a) in `data/sourced-claims.json`, (b) cited inline via `<details class="cite">`, or (c) labeled illustrative. `scripts/check-fabrications.mjs` + `scripts/check-audio-fabrications.mjs` are fail-CI. Zero inventions.
- **No live cents on the Cost Index hub/index** — cents only in per-ingredient cited "Market read" blocks.
- **Don't loosen any `check-all.mjs` gate.** Add craft *inside* the gates.
- **Static site**: HTML + inline CSS, **no framework, no CMS, no client fetch on tool pages** (`check-tool-no-fetch.mjs`), no storage of financial inputs. Same-origin scripts only.
- **Motion**: every animation `prefers-reduced-motion`-gated + a static final-state fallback; compositor-only props (`transform`/`opacity`); **no new `@keyframes`** without checking `check-keyframes-allowlist.mjs`. CSP allows `'unsafe-inline'` (verified in `_headers`), so inline style/keyframes are fine.
- **A11y**: WCAG contrast, decorative SVG `aria-hidden` with facts in text/aria-live, 16px+ inputs (no iOS zoom), focus order intact.
- **Palette is fixed**: `--cream`/`--ink`/`--teal #2A50C8`/`--rust`/`--stone` + tints derived from them. **No fourth hue.** Teal/rust are *signal* colors — don't spend them as decoration.
- **Fonts**: Fraunces (display, self-hosted) + Inter (body). No CDN/Google-Fonts.
- **Git**: work on `claude/muntin-strategic-council-fzdd1j`; commit as `Claude <noreply@anthropic.com>`; **no PR unless the founder asks**; pull-rebase before push (a Cursor agent is review-only on this branch). Never put the model ID in commits/artifacts. GitHub only via `mcp__github__*`. Repo scope: `donwonmagic/potentially-profitable` + `donwonmagic/muntin-invoice-decoder` only.

## What's already done (build on it — don't redo)

- **Cost Index tool** got the full futures-edge pass. Foundations in `tools/cost-pulse/index.html` (+ `es/`) inline CSS: a **derived elevation feel**, `.cp-range-hero` (Fraunces `clamp(23–29px)`, negative tracking, tabular+lining nums), `.cp-market-item[data-conf]` confidence rule, `.cp-cmp-*` comparison UI, `.cp-reveal`/`prefers-reduced-motion` block. JS in `tools/_shared/cost-index-ui.js` (`slopeSvg` wedge, `sparkSvg`, `bandSvg`, `revealOnAppend`).
- **The recent commits** (`48780bf`→`f6de91a`) are the reference for the aesthetic + the honesty discipline. Read them to calibrate.
- **The design tokens** live in `assets/site-core.css` (`:root`, elevation `--elev-*`, motion `--t-*`/`--ease-*`, `--ring-focus`, dark-mode block) and the per-page `:root` in tool HTML. **Reuse these**, don't invent parallels.

## Where to look (my hypotheses — verify, don't assume)

The Cost Index is now the most polished surface; these are likely *more restrained by comparison*:
1. **The homepage / front door** — is the hero as striking as the tool cards became? Biggest-leverage surface.
2. **The `/ledger/` page** — the paid product's storefront page; deserves premium treatment.
3. **Library + blog article shells** — the `viz-*` graphics are strong, but the page frame/typography around them may be plain. See `assets/site-article.css`.
4. **The `/tools/` hub, `/about/`, `/security/`, `/methods/`** — landing surfaces that could be more immersive.
5. **Depth/elevation across the site** — the tool got an elevation scale; most pages are still flat.
6. **Motion beyond the tool** — the reveal/entrance pattern + hover states could extend site-wide (all reduced-motion-gated).
7. **Fraunces confidence** — the display face may be used timidly; bigger editorial display moments elevate without cost.
8. **OG cards / favicons / micro-interactions** — `brand/og/cards.json`, `scripts/build-og-cards.mjs`.

## How to work (the cadence that's been landing)

1. **Evaluate first.** Browse the actual rendered pages (harness below) before proposing. Bring a ranked list of "too-restrained" findings with screenshots.
2. **Dispatch a specialist team for the plan.** The pattern that worked: **parallel background `Agent` calls** (art-director, data-viz/interaction, front-end/perf+a11y, brand-voice, + an adversarial critic), each grounded with real file anchors, returning a written plan; then you synthesize + run an adversarial pass. (The `Workflow` tool errors in this env — use `Agent` calls.)
3. **Get founder sign-off on scope/ambition before big execution** — this is outward-facing brand. Use `AskUserQuestion` when it works, else plain-text options.
4. **Execute in small, verified commits.** Browser-verify EN + ES, run gates, commit, pull-rebase, push.
5. **Adversarial-audit your own work** before committing (a background `Agent` skeptic) — it's caught real issues every time.

### Dev / verification harness (reuse verbatim)
- Serve: `python3 -m http.server 8799` in repo root.
- Headless Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; playwright-core at `/tmp/pw/node_modules/playwright-core` (CommonJS: `import pkg from '...'; const {chromium}=pkg`). Screenshot scripts in `/tmp/pw/*.mjs`. Test **reduced-motion** with a `reducedMotion:'reduce'` context.
- Gates: `node scripts/check-fabrications.mjs`, `node scripts/check-tool-no-fetch.mjs`, `node scripts/check-all.mjs` (baseline ~**221/239** locally — the ~18 "failures" are idempotency/regeneration checks that **pass in the deploy build** after the regen scripts run; don't chase them). CSS: `node scripts/build-css-shells.mjs && node scripts/minify-css.mjs --in-place` catches lightningcss syntax errors (then `git checkout -- assets/`).
- The **deploy build** is the long `build.command` in `wrangler.jsonc` ending in `check-all.mjs` then minify/pagefind. It reproduces green locally through every runnable step.

## Open threads (context, not your task unless asked)

- **Ledger** (`muntin-invoice-decoder`): PR #234 merged — the "vendor vs market" comparability gate + proxy-quality registry. Remaining: `apps/api` route passes `line.slug`; the market-data pipeline (founder-gated API keys + cron); the `/today` surface + deterministic vendor-letter chip. See the plan in this session's history.
- **Storefront PR #493**: footer CTA fix pushed; the branch build is code-sound (green locally). Its red checks (`test`/`axe`/`lhci` fail in ~1s = setup infra; Cloudflare "Workers Builds" = production-deploy-from-PR gating) are **environmental/CI-config, founder's domain**, not code defects.
- **Deep-fetch**: `data/cost-index-history.json` — when the founder finishes fetching all 107 ingredients, re-run `node scripts/build-cost-index-history-seed.mjs` to extend the tool's comparison window.

## First moves

1. Read the recent commits + `tools/cost-pulse/index.html` to internalize the established ceiling.
2. Stand up the harness, screenshot the homepage / `/ledger/` / a library article / the tools hub.
3. Produce a ranked "too-restrained" findings list, then dispatch the specialist team for the plan.
4. Bring the founder a plan + ambition options (calm-plus vs bolder) before executing the big surfaces.
