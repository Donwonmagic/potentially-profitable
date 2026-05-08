# Invoice Decoder — OCR overhaul ship runbook

This is the operational reference for the V1→V2 OCR overhaul shipped on
branch `claude/audit-invoice-ocr-8MGRP`. Use it for: pre-merge sanity
checks, first-24h telemetry watch, fast rollback paths, and the
post-deploy supply-chain bootstrap step.

---

## What shipped

A two-engine OCR pipeline with quality-driven escalation:

- **V1** — Tesseract.js multipass + PaddleOCR ensemble (existing engine,
  unchanged)
- **V2** — PP-OCRv3 ONNX via onnxruntime-web + DocLayNet layout (new,
  flag-gated)

Routing in `tools/invoice-decoder/ocr-shim.js`:

1. Default path: V1 first; if V1 returns < 2 lines (the "found nothing"
   complaint), escalate to V2. V2 wins by line count → fire 'V2
   Escalation Win' telemetry. V2 fails → fall back silently to V1.
2. V2-first path: opt-in via `?engine=v2` URL param or
   `localStorage 'id-engine-v2'='on'`. Used by beta operators.
3. Kill-switch: `localStorage 'id-engine-v2'='off'` suppresses V2
   entirely. Operators flip via the **"Reader settings"** disclosure
   panel inside the honesty card.

---

## Pre-merge sanity (run locally)

```bash
# Full build gate (118 of 119 must pass — see "known floor" below)
node scripts/check-all.mjs

# Invoice-decoder test harness (~155 assertions)
node scripts/test-invoice-decoder.mjs

# Egress invariant (4 server + 105 client files scanned; 0 violations)
node scripts/check-no-invoice-egress.mjs --check

# Bilingual parity (10 structural rules matched between EN + ES pages)
node scripts/check-invoice-decoder-bilingual-parity.mjs --check

# Vendor-pin dry run (verify hash-drift gate active + size guard works)
node scripts/vendor-pin.mjs
```

**Known floor:** check-all should report 119/119 after the inject
scripts have run (CI runs them automatically before check-all). If
running locally without the inject scripts first, expect ~115/119
(the missing failures are CSS cache-bust + glossary inject idempotency
checks that auto-resolve in the build pipeline).

---

## First-24h telemetry watch (Plausible dashboard)

After deploy, watch these events. Healthy patterns vs red flags:

| Event | Healthy | Red flag |
|---|---|---|
| `Invoice Decoder Read` filtered by `engine_version` | mostly `'v1'`, growing slice of `'v2'` (escalation wins) | `'v2-fallback'` >> `'v2'` (V2 fires but always errors) |
| `Invoice Decoder V2 Escalation Win` | a few per day, growing as V1-failure cases hit V2 | zero (V2 never producing better output → URL or BGR issue) |
| `Invoice Decoder V2 Escalation Fail` `code` prop | mostly `IMAGE_QUALITY` (V2 honestly says "unreadable") | `MODEL_LOAD` or `WASM_COMPILE` dominant (deploy or CSP issue) |
| `Invoice Decoder Reader Setting Changed` `choice` prop | few or none (default works) | spike of `'v1'` (operators flipping kill-switch — V2 broke something) |
| `Invoice Decoder Error` `code` prop | same as today's baseline | spike vs baseline (regression) |
| `Invoice Decoder Layout Model Failed` `reason` prop | rare; mostly `no-regions` or `shape-mismatch` | `load-fail` dominant (model file 404 or wasn't deployed) |

The kill-switch flip rate is the single most important canary: a panic
flow looks like sustained `Reader Setting Changed → choice='v1'` events
in the first hour. If you see >5 in 60 min, escalate to "fast global
rollback" below.

---

## Fast global rollback paths

### Per-operator kill-switch (zero-deploy, instant)

Operators self-rescue by visiting the tool, opening **"Reader
settings"** in the honesty card, picking **"Only the standard reader"**.
Their device skips V2 from that point forward; the choice persists in
localStorage across visits. You can tell support to share this URL +
instruction.

### Fast global rollback (single commit, ~2 min deploy)

If V2 is misbehaving for many operators:

```bash
git checkout main && git pull
git checkout -b emergency/disable-v2-escalation

# Edit tools/invoice-decoder/ocr-shim.js — change V1_ESCALATION_THRESHOLD
# from 2 to 0 (so escalation never fires). Or early-return V1 in
# recognizeMultiPass + recognizeMultiPassEnsemble.

git commit -am "Emergency: disable V2 escalation, V1-only routing"
git push -u origin emergency/disable-v2-escalation
# Merge to main and let Cloudflare Pages redeploy (~2 min).
```

V2 module code stays installed but never runs. V1 owns 100% of reads.

### Full revert (nuclear option, ~2 min deploy)

If everything is wrong:

```bash
git checkout main && git pull
# Revert all 33 commits on this branch (range from base merge to current head):
git revert --no-edit <merge-base>..<current-head>
git push origin main
```

This takes the site back to before the OCR overhaul. Cloudflare Pages
redeploys in ~2 minutes.

---

## Post-deploy: supply-chain hash bootstrap (1 follow-up commit)

The hash-drift gate ships ACTIVE with 32 expected entries (covers
Tesseract.js, pdfjs, SheetJS, ORT, language packs, LICENSE files).
Missing: 16 HuggingFace-hosted model files (sandbox-blocked at PR time;
CF Pages CI can reach them).

After the first successful deploy, run from a network-unrestricted
environment:

```bash
node scripts/vendor-pin.mjs --bootstrap-expected
git add scripts/expected-integrity.json
git commit -m "Bootstrap: lock HuggingFace ONNX hashes from CF Pages CI"
git push
```

The expected-integrity file expands from 32 → ~48 entries. From this
point forward, an upstream re-upload of any pinned model triggers a
build-blocking diff in the next deploy.

---

## Build-time guards in place

The build pipeline now hard-fails on:

1. **Empty integrity manifest** — `MIN_TOTAL_WRITES = 20` floor in
   vendor-pin. Catches HF outage shipping V1-only silently.
2. **Hash drift** — any pinned vendor file whose sha384 differs from
   `expected-integrity.json`. Catches upstream supply-chain swap.
3. **Per-file size > 24 MB** — Cloudflare Pages refuses files > 25 MB
   silently. The 24 MB floor (1 MB headroom) catches DocLayNet
   layout-heron and similar large ONNX files BEFORE deploy.
4. **Truncated downloads** — `fetchBuffer` verifies Content-Length
   matches body length. Catches CDN edge-fail mid-transfer.
5. **Tar produced empty dist** — `test -f dist/index.html` after the
   tar pipe in `wrangler.jsonc:146`. Catches disk-full or bad-exclude
   pattern in CI.

Bypass for local dev: `--allow-offline` (vendor-pin) or
`--skip-min-writes-check`. **Never set these in `wrangler.jsonc`.**

---

## CSP posture

`wasm-unsafe-eval` is path-scoped to `/tools/invoice-decoder/*` and
`/es/tools/invoice-decoder/*`. Every other page on the site has the
tighter CSP without it. If you add a new tool that needs WASM
compilation, add a path-scoped block in `_headers` rather than
broadening the global block.

`_compare/` is `noindex,nofollow` AND `tar-excluded` from production
deploys (`wrangler.jsonc` excludes `tools/invoice-decoder/_compare`).
For staging review, build locally and inspect.

---

## Privacy contract enforcement

- **Egress regex** — `scripts/check-no-invoice-egress.mjs` scans 4
  server + 105 client files (HTML + JS) for: fetch with remote URL,
  sendBeacon, XHR, WebSocket, EventSource, Image-src exfil, RTC peer,
  SharedWorker, Worker, importScripts, BroadcastChannel, cross-frame
  postMessage, remote-origin preconnect/prefetch, remote-origin
  serviceWorker.register. Same-origin paths pass cleanly.
- **Plausible event discipline** — every event the OCR overhaul fires
  has a hardcoded prop-key allowlist enforced at test time
  (`scripts/test-invoice-decoder.mjs` — Plausible event prop
  discipline section, 6 checks). Adding a key triggers a CI failure.
- **Bilingual parity** — every load-bearing structural ID/class/event-
  name in the EN page has a matching ES counterpart, enforced by
  `scripts/check-invoice-decoder-bilingual-parity.mjs` (10 rules).

---

## Known limitations / future work

1. **PaddleOCR npm package unpublished.** The V1 ensemble's
   `@paddlejs-models/ocr@2.2.5` doesn't exist on npm (latest is 1.2.4).
   Vendor-pin tries the package, fails gracefully, ensemble code path
   detects the missing package and falls back to Tesseract-only. This
   has been the production behavior for some time; not a regression.
2. **Full AbortController plumbing** is in the engine but not wired in
   the controller. Mid-call abort tears down ORT cleanly IF a caller
   passes `opts.signal`. Adding a "Stop" button or a navigation-cancel
   hook is a clean drop-in: pass `controller.signal` in the recognize
   call and the engine honors it.
3. **No deploy-time smoke test.** A future GitHub Actions cron could
   hit the deployed page and verify the engine loads. Out of scope
   for this branch.
4. **No Playwright / browser CI** running real ORT inference against
   synthetic fixtures. The 792 SVG fixtures are rendered but never
   OCR'd in CI today; the acceptance gate uses a deterministic
   confusion-table simulation. Real-browser smoke is a follow-up
   sprint.
5. **COOP/COEP headers** would unlock multi-thread ORT (5-15s →
   2-5s on mid-tier phones) but break embedded cross-origin resources
   (gstatic fonts, third-party blog embeds). Documented enabling
   criteria in `tools/invoice-decoder/ocr-engine.js:78-93`.

---

## Self-host roadmap (parallel track)

A Go launcher binary (~35 MB total) would let operators run the tool
offline / air-gapped / white-labeled. ~30 person-days to GA over 12
weeks. Free quick win at week 1: tighten the existing PWA manifest +
service worker for an "Install to use offline" prompt, validating
demand before launcher work.

White-label config schema:

```json
{
  "brandName": "Acme Tacos",
  "themeColor": "#B8332C",
  "logoSvg": "/brand/acme-mark.svg",
  "supportUrl": "https://acmetacos.com/help",
  "telemetry": { "enabled": false, "endpoint": null }
}
```

Telemetry off by default in self-host; CSP `connect-src` strips
`plausible.io` so the air-gapped persona can't leak even if toggled
on. Optional `--analytics` flag for enterprise BYO endpoint.

---

## Audit cross-reference

This shipping-quality work landed in three batches:

1. **7 CRITICALs** (commits `2a0825ac` → `c73968be`) — pre-merge
   blockers. layout.js tensor leak fix, vendor-pin guards, CSP
   path-scoping, ES panel mirror, touch targets.
2. **23 HIGHs** in clusters (commits `79f1ff97` → `3662a565`) —
   privacy hardening, UX a11y, build hardening, shim correctness,
   test gap closure.
3. **Quality polish** (commits `025ea390` → `b71b47bc`) — hash-drift
   gate active, file-size guard, abort awareness, concurrency tests,
   UX papercuts.

Total: 33 commits on this branch. Build gates: 119 of 119 passing.
Test assertions: ~155 across the invoice-decoder harness.
