# Invoice Decoder — Comprehensive Review & Upgrade Plan

A synthesized, prioritized plan to take the flagship Invoice Decoder from a
solid privacy-first reader to the daily early-warning system that an average
restaurant owner reaches for as instinctively as the thermometer.

Drawn from a parallel review by ten domain-specific planning agents covering
OCR accuracy, vendor coverage, categorization, photo capture, verification UX,
accessibility, operator empowerment, integrations, security posture, onboarding,
and visual design. Each section names the files that change and the effort
sizing in engineer-days.

---

## 1. Current state — what's working

The tool is genuinely well-architected. Six thousand lines of carefully
factored code, no broken windows.

- **Privacy posture is honest.** Image bytes never leave the device.
  Tesseract.js runs in-browser via WebAssembly. Saves are AES-GCM 256 over
  PBKDF2-SHA256@250k. A `check-no-invoice-egress.mjs` build invariant
  blocks accidental fetches. A "verify it yourself" disclosure walks the
  operator through opening DevTools.
- **OCR pipeline is layered.** Otsu binarization, 1° Hough deskew, median
  3×3 denoise; multipass aggressive/gentle presets; per-line PSM-7 adaptive
  re-read on amber lines; quality scoring (Laplacian variance + bimodality)
  feeds retake-coaching before OCR burns 30 seconds.
- **Parsing is restaurant-aware.** Five regex patterns A–E cover the
  common line shapes; vendor detection registry recognizes seven
  distributors (Sysco, US Foods, GFS, Restaurant Depot, Shamrock, Sygma,
  PFG/Vistar/Reinhart) and applies confidence boosts.
- **Categorization is restaurant-real.** Nine operational buckets,
  bilingual EN/ES lexicon, three classification tiers (exact substring →
  Levenshtein fuzzy → unit+price-band heuristic) with an operator-learning
  Tier 0 override that wins over the lexicon.
- **Verification UX is competent.** Color-banded confidence rows, inline
  tap-to-edit cells, filter chips, sticky bulk-confirm bar, keyboard
  shortcuts (J/K/Y/N/1–9), 4-second swipe-undo toast.
- **Cross-tool fabric exists.** Trend strip, drift banner, three-button
  handoff to Plate Cost / Cost Pulse / Margin Math, context-bus shared
  module, encrypted cross-tool storage via device-key wrap.
- **Bilingual throughout.** EN/ES strings via a `tt()` helper, full ES
  page mirror, lang-hint banner, ES-aware lexicon and total regex.

## 2. Strategic gaps — where the leap lives

The tool reads accurately. It does not yet **earn its keep weekly** for the
operator. The leap from "we OCR'd this invoice" to "we just told you
something that saves $300/month" requires moving up one resolution: from
category aggregates to per-SKU rolling history, while preserving the
on-device promise.

Three gaps sit at the heart of everything below.

1. **Capture is the weakest link.** Real photos in real kitchens — folded,
   shadowed, perspective-skewed, glared — drop accuracy to ~70% on a
   single-pass OCR. Today's pipeline has no four-corner rectification, no
   Sauvola adaptive thresholding, no live capture coaching.
2. **Verification feels like work.** The 40-row scan-and-confirm is a slog
   at the end of a 12-hour shift. Confidence is communicated as a single
   pill, not field-by-field. Math drift is reported but not repaired.
   Anomalies aren't flagged against the operator's own history.
3. **Insights stop at the row.** The trend strip exists; per-SKU price
   drift, contract-price watch, vendor-level pricing summaries, and
   cross-vendor comparison live entirely in the operator's head.

The plan below closes each, in priority order, without breaking the
"works offline, lives on your device" promise.

---

## 3. Six-wave upgrade plan

Sized as one engineer's calendar; each wave is a 2–3 week shippable slice.
Earlier waves unlock later ones; nothing is bundled if it can ship on its own.

### Wave 1 — Capture, Math Repair, Owner Insights (3–4 weeks)

The single highest-ROI bundle. Solves the "did the supplier sneak a hike"
question and lops minutes off the verification ritual.

**1.1 Per-SKU price-drift card** *(M, 3d)* — `invoice-decoder.js`,
`index.html`, new `sku-history.js`. For every parsed row, render an inline
chip: "You paid $X. Last time: $Y. 90-day median: $Z." Anomaly badge
(`▲18% vs your typical`) when ≥15% off the rolling median; tap → mini
sparkline of last N invoices for that SKU. Foundational to almost every
empowerment feature below. New `MuntinContext.skuHistory` keyed by
normalized stem, capped 200 stems × 24 entries (~80KB local).

**1.2 Contract-price watch + reconciliation report** *(M, 2.5d)* — adds
`MuntinContext.contractPrices` (100-cap). One-time set per row;
future invoices flag any line where actual exceeds contract. End-of-week
button: "Sysco overcharged $37.80 on 4 lines this week — copy
reconciliation note." This is the feature that pays for the suite.

**1.3 Math reconciliation card with candidate fixes** *(L, 2.5d)* —
`parse.js`, `invoice-decoder.js`. When `Σ lineTotal ≠ totalParsed`, propose
a specific fix candidate: "We probably missed a line near the bottom; gap
is $14.32" or "Line 7 read as $48.00 — if it's $24, the math balances."
Suggestions are never auto-applied. Removes ~80% of "math is off" banners
by converting them into single-tap fixes.

**1.4 OffscreenCanvas / blob-direct OCR + 2-worker pool** *(S+M, 4d)* —
`ocr.js`. Stop calling `canvas.toDataURL('image/png')` on every page and
every amber re-read; pass the canvas directly to `worker.recognize()`.
Add a 2-entry worker pool keyed by `(lang, psm)` so multi-page invoices
parallelize. Net: ~30–40% faster end-to-end on multi-page bursts;
8-page invoices drop from ~30s to ~18s on an iPhone 11 SE.

**1.5 Credit / return / deposit / surcharge classifiers** *(S, 1d)* —
`parse.js`. Three new flags on each row by scanning `raw`:
`kind: 'credit' | 'return' | 'deposit' | 'surcharge'`. Drives
correct math in 1.3 and proper accounting category in Wave 4.

**1.6 Sauvola adaptive thresholding for the gentle preset** *(M, 2d)* —
`preprocess.js`. Replaces global Otsu when shadow/glare destroy
binarization. +3–5pp accuracy on shadowy photos.

**1.7 Per-row confidence by field** *(M, 1.5d)* — `parse.js`,
`categorize.js`, `invoice-decoder.js`, `index.html`. Replace single
`r.confidence` with `r.fieldConf = { name, qty, price, category }`. Render
as four small dots per row (filled/half/empty). Operator now sees *what*
the system is uncertain about. Backwards-compat: `r.confidence` remains
as `Math.min(...fieldConf)` for the bulk-confirm filter.

### Wave 2 — Capture-Coach, Vendor-Pulse, Honest Visualization (3 weeks)

Shifts the felt experience from "machine read" to "trusted partner."

**2.1 Live capture coach via `getUserMedia`** *(L, 6d)* — new
`capture-coach.js`, `index.html`, `preprocess.js`. Full-bleed video preview
with bottom-anchored 88×88 capture button (one-handed, greasy-thumb safe).
A lightweight worker samples one frame every ~150ms, runs grayscale →
Sobel → largest-quad contour, and overlays a teal trapezoid on the
detected document edges. Coach prompts (debounced 400ms): glare → fingers
→ blur → fill-frame → hold-steady → all-good. Fall back to today's
`<input capture>` when `getUserMedia` is unavailable or denied. iOS
Safari + Chrome Android both supported in 2026; HEIC handled via
`createImageBitmap`.

**2.2 Four-corner perspective rectification** *(L, 4d)* — `preprocess.js`.
Implement the deferred quad detection (largest-area 4-vertex contour on
downsampled binary), solve 8-DOF homography, warp to a fixed aspect
target (Letter or thermal). Shared between live coach (2.1) and
post-capture preprocess. Single biggest accuracy win on real-world
phone-tilted photos: +6–9 pp.

**2.3 Vendor Pulse Strip** *(M, 1.5d)* — replaces top of
`id-parsed-summary`. Single line: `Sysco · Tue Apr 28 · 41 lines · $1,842.10`
followed by three pill-deltas (`Chicken thigh +18%`, `Cilantro +9%`,
`Napkins -4%`). Tap a pill → jumps + highlights the row(s). Empty-state
copy when this is the operator's first invoice from that vendor:
"First Sysco invoice we've stored — saving this one starts your baseline."

**2.4 Smart-order sort & "Confirm the rest" CTA** *(S+S, 1d)* — sort
filtered list by `(1 − minFieldConfidence) × lineTotal × (categoryFallback ? 1.4 : 1)`
so the riskiest rows come first. Sticky CTA reads
`Confirm the remaining 11 as-is` (live count). Wide undo banner with 5s
timer replaces corner toast for bulk actions.

**2.5 Confidence semantics: shape + color, not color alone** *(S, 0.75d)*
— `index.html`. Add a 14×14 leading SVG glyph per row (check / ! / ✕) so
the meaning survives colorblindness and monochrome printing. Tighten the
amber band: shift fill to `#FFFBEC` border `#D9A93B` so it stops fighting
with rust. Category pill stays — but the row layout becomes one
disciplined grid: `[icon 18px] [name 1fr] [qty auto] [price 80px] [cat 110px]`.

**2.6 Margin-impact callout** *(M, 2d)* — when `MuntinContext.dishes`
contains saved Plate Cost recipes and this invoice's price changes touch
≥1 of the dish ingredients, surface "This invoice shifts Caesar food cost
+1.4 pp, burger +0.8 pp." Renders in the existing `idHandoff` panel above
the three buttons. Pure derivation; no new schema.

**2.7 Diff-strip earns its volume** *(S, 0.5d)* — gate the teal-gradient
banner on `magnitude="high"`; below threshold it stays hidden. Soften the
gradient when shown.

### Wave 3 — Trust, Verify, Accessibility (2 weeks)

**3.1 WCAG 2.2 AA remediation** *(L, 5d)* — `index.html`,
`invoice-decoder.js`, `accessibility.html`, `es/`. Concrete SC fixes:
- **1.3.1** — heading hierarchy (h1 → h2 → h3, no skip). Convert
  `<ul class="id-parsed-list">` to `<table role="table">` with `<th scope="col">`
  for honest screen-reader semantics. Each row gets an `aria-label` like
  *"Tomatoes, 2 cases, $48.50, produce, 76% confidence, needs review."*
- **1.4.3, 1.4.11** — bump filter-chip text to ≥4.5:1; tighten
  amber/rust separation per 2.5; add `:focus-visible` rings on every
  interactive (`.id-input-chip`, `.id-bulk-confirm`, `.id-read-btn`,
  `.id-handoff-btn`, `.id-drift-dismiss`, `.mid-pf-close`, `[data-edit]`).
- **2.5.5/2.5.8** — pad inline `[data-edit]` spans to `min-height:44px`.
  Promote keyboard shortcuts to **visible** Y / N / Edit / Skip buttons
  per row.
- **2.5.7** — every swipe gesture gets a single-pointer alternative.
- **3.3.1/3.3.3** — wire `aria-invalid` + `aria-describedby` between
  failing inputs and the status banner.
- **4.1.3** — throttle the `aria-live` region: announce phase-change
  + 25% increments only, not every Tesseract progress tick.

**3.2 Plain-language microcopy pass** *(S, 2d)* — Flesch-Kincaid grade-7
audit across every visible string. "Need review" → "Check these"; "amber"
→ "yellow"; "verify before saving" → "Numbers don't match. Check them."
Drop sprint codes (`Wave B5` leak in `id-coming`). Audit ES parity:
`Intl.NumberFormat` for currency (Mexico uses comma decimal),
`Intl.DateTimeFormat`, no string concatenation that breaks ES word order.

**3.3 Permanent compact keyboard legend + Cmd-K command palette** *(S, 0.5d)*
— `index.html`. Bottom-right `Y confirm · N flag · J/K next/prev · ⌘K all
shortcuts`; Cmd-K opens a searchable full-screen overlay covering every
keyboard action.

**3.4 Skeleton loading + microinteraction set** *(M, 2d)* — `index.html`,
`invoice-decoder.js`. 8 placeholder rows with 1.6s shimmer during OCR;
220ms `border-left-color` rise on edit-commit (rust → amber → green);
600ms teal underline on save success. Reuses `tool-skeleton-card` pattern
from `site.css:5267`. All wrapped in `prefers-reduced-motion` guards.

**3.5 Honesty card → skimmable accordion** *(S, 1d)* — `index.html`. Lift
the four trust paragraphs into `<details class="id-honesty-fact">` with
single declarative summaries ("Your invoices stay on your device" /
"We don't sell, train, or pool your data" / "We won't sync to QuickBooks"
/ "Open Network tab — it stays empty"). Add HowTo schema to the
verify-it-yourself steps (Google rich-result eligible).

### Wave 4 — Vendor Coverage, Categorization Depth, Accountant Bridge (3–4 weeks)

**4.1 Refactor vendors.js → JSON-per-vendor + lazy loader** *(M, 3d)* —
`vendors.js`, new `vendors/_index.json`, `vendors/template-runtime.js`.
Detection stubs ship inline (~3 KB total for 20 vendors); full templates
load only when matched. Schema spec (lineGrammar, columnAnchors,
packSize, headerSkip, categoryHints, bilingual) in
`docs/invoice-decoder-vendor-template-schema.md`.

**4.2 Top-15 vendor templates** *(M, 0.5–1.5d each, ~10d total)* — new
`tools/invoice-decoder/vendors/*.json`. Priority list, beyond the seven
shipped:
1. Cheney Brothers (FL/GA/SC/AL/TN/NC broadliner — biggest single gap)
2. Ben E. Keith Foods (TX/OK/AR/NM/LA/MS)
3. Imperial Dade (paper/chemical, NE+FL+CA)
4. KeHE Distributors (specialty/natural)
5. UNFI (organic produce + grocery)
6. Costco Business Center (thermal-receipt format)
7. WebstaurantStore
8. Maines Paper & Food (NE indie pizza/diner)
9. Baldor Specialty Foods (NYC/Boston/DC/Philly/Miami fine-dining)
10. FreshPoint (Sysco produce sub, distinct format)
11. H Mart / Restaurant Depot Asia / 99 Ranch (bilingual EN/KO/ZH)
12. Mexican wholesalers (Northgate, Mariscos Linares, La Michoacana)
13. Veritiv (paper/packaging, PNW + Midwest)
14. Dairy specialty / DSD (Hiland, Borden, Producers Dairy, Crystal)
15. Beer/wine (Republic National, Southern Glazer's, Reyes Beverage)

Bilingual ethnic and DSD/thermal vendors require small runtime
extensions (`format: thermal`, `alcoholTax: true`).

**4.3 Auto-learn for unrecognized vendors** *(M, 2.5d)* — new
`vendors/auto-learn.js`. After 3 invoices from the same letterhead
(minhashed top-200-chars normalized) score below threshold, induce a
template: histogram column X-positions, infer header skip, abstract regex
shapes. Persist as `MuntinContext.learnedVendors[hash]`. Ask the operator
once: "Save this layout as 'My Local Produce Co.'?" Uses the existing
`learnings.js` storage pattern.

**4.4 Lexicon expansion + stemming + brand index** *(M, 4d)* —
`categorize.js`. Add ~250 entries across Asian aromatics (lemongrass,
gochujang, doubanjiang, miso, kombu), Mexican (chile de árbol, hoja santa,
masa harina, queso oaxaca), Middle Eastern (tahini, za'atar, freekeh),
Indian (paneer, methi, asafoetida), Halal/Kosher specifics, distributor
SKU stems (CHKN, FRZN, RFG, IQF, CAB, DSCT, BRC), shorthand abbreviations
(chx, brkfst, mtbll, frzn, w/), beverage gaps (oat/soy/almond milk,
RTD cocktails, cold brew concentrate), and paper/cleaning brand names
(EcoLab, Diversey, P&G Pro, Dawn Pro, Simple Green).

New helpers:
- `expandTokens(name)` — abbreviation + plural-stripper, called inside
  `normalize()`.
- Token-set Jaccard similarity in `tier2Fuzzy` alongside Levenshtein,
  re-enabling multi-word matches.
- Trigram cosine fallback for OCR-corrupted text ("groundbeef" →
  "ground beef").
- Per-vendor unit-price priors in `tier3Heuristic` keyed by `row.vendor`.
- `parsePackaging()` extracts `24/12 BTL` → `{ caseQty, unitSize, unit, container }`.
- `BRAND_INDEX` table mapping ~150 brand names to category, surfaced in
  the proof flyout as "matched STELLA ARTOIS as beverage (brand)."

**4.5 Operator-learning upgrades** *(M, 2d)* — `learnings.js`,
`proof-flyout.js`. Variant propagation (correct one Stella Artois SKU,
get all sizes). Bilingual mirror (correcting an EN row writes ES too via
lexicon synonym lookup). Trust UI chip "Auto-applied: you classified this
in last week's invoice."

**4.6 Accountant CSV export drawer** *(M, 4d)* — new
`accountant-export.js`, `gl-accounts.js`, `index.html`. Five formats,
generated entirely in-browser via `URL.createObjectURL(blob)`:
QuickBooks Online "Bills" CSV, QuickBooks Desktop IIF, Xero CSV,
ContPaqi/Aspel CSV (Spanish, comma decimals), generic ledger.
GL-account suggestions per category; operator can override per row before
download. Update the "Isn't" copy in `index.html:583` from "Won't sync to
QuickBooks" → "Doesn't sync in real-time — instead, exports a one-click
CSV your accountant imports in any of the four most common formats."

**4.7 Tags layer (orthogonal to the 9 buckets)** *(S, 1d)* — `categorize.js`.
Adds `r.tags = []` for `frozen | perishable | alcoholic | non-alcoholic |
allergen-major | local | organic | house-made`. Filterable but not
navigational; preserves the 9-bucket plate-cost handoff.

### Wave 5 — Onboarding, Trust Earning, Returning-Visitor (2 weeks)

**5.1 Sample-run demo** *(M, 1.5d)* — new `samples.js` with three
fixtures (Sysco, Restaurant Depot, generic produce jobber). Pre-rendered
cleaned canvases + pre-baked OCR `lines[]` skip the Tesseract round-trip
for instant gratification while the user still feels the pipeline. After
sample finishes: "This was our sample. Your real run looks the same — and
your data never leaves your phone. Now try yours." Visible only when
`MuntinContext.invoiceDecoder.hasRun !== true`.

**5.2 Phase ladder + ETA + pro-tip carousel during the wait** *(S, 0.5d)*
— `invoice-decoder.js`. Replace single status line with phase ladder
(Cleaning → Reading p X of Y · ~12s left → Sorting → Looking up vendor),
ETA from `pendingPages.length × ~12s` revised live, rotating tip every 6s
("Tip: PDFs read in 1s instead of 30. Ask your distributor to email you
one"), bail-out: "You can switch tabs — we'll keep working."

**5.3 Error catalog with paths forward** *(M, 2d)* — `invoice-decoder.js`.
- Photo > 12 MB → inline "Auto-resize this for me?" button (downsample to
  6 MP via existing `preprocessFile`).
- Blurry + low-contrast → side-by-side "Your photo / What works" with
  bullet retake instructions.
- OCR returns 0 lines → "We couldn't pull readable lines. Try (1) a
  brighter shot, (2) the PDF tab, (3) type one row to test." Reveal "Show
  raw OCR text" debug.
- Tesseract CDN fails → Retry / Type one row manually / Try again offline
  tomorrow (cached after first load).
- Storage quota → modal listing oldest 5 saves with one-tap delete.
- Network blip on save → queue in IndexedDB under `pending-save:<aad>`,
  banner "Saved locally. We'll retry when you're back online," `online`
  listener flushes.
- Forgot passphrase on return → honest modal explaining it can't be
  recovered, options stated plainly.

**5.4 Passphrase generator + first-run framing** *(S, 0.75d)* —
`passphrase-modal.js`. EN+ES 200-word lists, correcthorse 4-word
generator, big "Write this down" warning. First-run variant
(`mode === 'create'` AND `count === 0`): full-card explainer above the
inputs — "Why a passphrase? Why can't we reset it? How to never forget."
90-word max.

**5.5 Returning-visitor + abandonment recovery** *(M, 1.5d)* — new
`resume.js`. Persist a tiny IndexedDB record on each preprocessing
complete (`{photoBlob, pendingPages, parsedRows, savedAt}`). On next load,
if found and < 24h old, surface "You had an invoice in progress yesterday
— resume?" Wipe on save or explicit dismiss. Returning-visitor banner
above input chips when `count >= 1`: "Welcome back. 12 invoices saved.
Last week: $4,820 across produce + dairy."

**5.6 Personal accuracy stat + funnel-promise unification** *(S+XS, 0.75d)*
— Once `count >= 3`, replace static "Last verified May 1" with "On your
last 5 invoices, 94% of rows read correctly first time." Single shared
promise string in `tools/_shared/promises.js` driving `/tools/`,
`/tools/start/`, and the tool hero so they stop drifting.

**5.7 60-second captioned how-to video (EN+ES)** *(S, 0.5d, plus
production)* — same-origin MP4 to honor no-third-party-fetch. Embedded in
a `details` block "Show me how this works."

### Wave 6 — Privacy, Polish, PWA (2–3 weeks)

**6.1 Argon2id KDF + envelope v2** *(L, 4d)* — `encrypt.js`. Self-host
`argon2-browser` WASM under `/assets/vendor/argon2@…/`. Migrate from
PBKDF2-SHA256@250k to Argon2id (m=64MiB, t=3, p=1). Envelope `v: 2` adds
`kdf, m, t, p, pepperVersion`. Keep `decryptPayload` accepting v1+v2;
re-encrypt-on-read upgrades v1 envelopes silently after first unlock.
Strengthen AAD to bind `sub‖itemId‖envelope.v‖kdfParams` so envelope
downgrade is blocked. Replace `__keyCache` Map with `WeakRef`-keyed +
auto-clear on `visibilitychange` + `blur` + `pagehide` + idle timeout.
Drop `window.MID_ENCRYPT` global; expose via SharedWorker so DOM-context
extensions cannot reach it.

**6.2 WebAuthn passkey wrap (optional path)** *(L, 5d)* —
`passphrase-modal.js`. Generate a random 256-bit `dataKey`, encrypt it
with a key derived from the passkey's `prf` extension (WebAuthn L3),
store the wrapped blob alongside the envelope. No passphrase needed on a
registered device. Falls back to passphrase on others. Feature-detect
`navigator.credentials?.create`.

**6.3 Recovery code + multi-device pairing** *(M, 4d)* — `passphrase-modal.js`.
At create-mode submit, generate a 24-word BIP39-style recovery phrase;
dual-wrap the dataKey: `enc_pp(dataKey)` AND `enc_recovery(dataKey)` both
in the envelope. Print-or-copy emergency-kit screen. Multi-device
pair-via-QR (X25519 ECDH); laptop generates ephemeral keypair → QR; phone
scans, derives shared secret; laptop encrypts dataKey to that secret →
second QR; phone scans → unlocks. Pure client-side; no server.

**6.4 Self-host vendors + SRI** *(M, 3d)* — `ocr.js`, `pdf-extract.js`,
`csv-extract.js`, `_headers`, new `scripts/vendor-pin.mjs`. Pin
Tesseract / pdfjs / SheetJS by integrity hash under
`/assets/vendor/<name>@<sha>/`. Drop `https://cdn.jsdelivr.net` from CSP
`script-src`; add per-script SRI. Eliminates the compromised-CDN
threat entirely.

**6.5 Egress check expansion + runtime sentinel** *(S, 2d)* —
`scripts/check-no-invoice-egress.mjs`, `invoice-decoder.js`. Forbid
`fetch / XMLHttpRequest / sendBeacon / EventSource / WebSocket / import()
of remote / importScripts to non-allowlisted`. Allowlist pinned vendor
bootstraps via `// vendor-bootstrap-allowlisted` sentinel comments.
Runtime: monkey-patch `window.fetch` and `XMLHttpRequest.prototype.open`
to throw if the call originates from a stack frame containing
`invoice-decoder.js` AND the URL isn't allowlisted; Tesseract-internal
fetches pass because they originate from `tesseract.min.js`.

**6.6 "Run Privacy Self-Check" feature** *(M, 3d)* — new `self-check.js`,
extends `proof-flyout.js`. One-tap button records all
`performance.getEntriesByType('resource')` during a synthetic OCR run on
a bundled fixture, asserts every entry's origin is in
`{self, plausible.io if telemetry on, vendor-allowlist}`, hashes
`localStorage` keys, renders a JSON+PDF report signed with a per-tool
Ed25519 key whose private half lives in CI. Operator can hand this to
their lawyer.

**6.7 Telemetry kill-switch** *(S, 0.5d)* — `invoice-decoder.js`.
`MID_TELEMETRY.disable()` toggle persisted to
`localStorage['mtn:telemetry']`; every `window.plausible(...)` call site
early-returns when off. Add explicit "Privacy mode" pill in the tool
header. Audit Plausible event props: ≤ low-tens distinct values, never
filenames or row contents.

**6.8 PWA + offline service worker + share target** *(M, 2.5d)* —
`tools/invoice-decoder/manifest.webmanifest`, `sw.js`, `index.html`. Cache
HTML/JS/CSS/Tesseract WASM/lang data with cache-first; message-based
update prompts; Web Share Target POST-multipart accepting
`image/* + application/pdf` lands on `?shared=1` and auto-opens the photo
handler (iOS 16.4+, Chrome Android). Verify SW never `fetch`es remote;
only `caches.match`. Same-origin only — no fetch invariant preserved.

**6.9 Camera MediaStream path (no-gallery-leak)** *(M, 3d)* — already
in 2.1, but here we explicitly remove the `<input type="file" capture>`
default once the live coach is stable on iOS+Android. Saves never persist
a thumbnail to the OS gallery.

**6.10 Desktop split-pane** *(M, 2d)* — `index.html`. ≥1024px only:
`grid-template-columns: 320px 1fr`, left rail = collapsed cleaned image +
vendor pill + filter chips (sticky), right rail = parsed list + bulk bar.
Hero/walkaway/honesty stay centered at 720px. Auto-collapse the
dual-image preview after OCR completes (P2 from visual-design plan).

**6.11 Dark mode (Stage 1: prefers-color-scheme)** *(M, 2d)* —
`assets/site.css`, `index.html`. Cream → `#14161A` family, ink-soft →
`#C8C2B6`, line → `#2C3036`, teal-tint → `#1F3A37`. Pastel category fills
become 12% white-on-ink overlays of their hue. Dark equivalents for
`.id-coming` and `.id-drift-banner` literals.

---

## 4. Insights deferred (deliberately)

These appear in the source plans but are explicitly recommended for
future evaluation — not because they're wrong, but because the cost
exceeds the benefit at this moment.

- **Second OCR engine (PaddleOCR WASM, ONNX TrOCR).** Bundle cost
  (12–150 MB) breaks the offline-first promise. Revisit only after
  Wave 1+2 land and we have honest accuracy telemetry against real
  fixtures.
- **Email forwarding to a `[hash]@invoices.muntin.digital` target.**
  Even bring-your-own-key ProtonMail-style breaks the metadata claim
  (timing, sender domain, frequency). Document Share-Sheet + folder-watch
  alternatives instead (see 6.8 + 4.6).
- **Real-time POS OAuth (Toast / Square Partner APIs).** Server-side
  token broker contradicts zero-fetch. Paste-in CSV (deferred subsection
  of 4.6) covers it.
- **Cross-restaurant pooling / benchmark dataset.** Ruled out by privacy
  posture. USDA/BLS *public* commodity overlays are acceptable (deferred
  to a future Cost Pulse extension).
- **Bookkeeper viewer-only sub-account.** Real ACL surface is its own
  product; if demand emerges, ship as "Muntin Books Bridge" not bolted
  on.
- **WebAuthn-as-default.** Optional path in 6.2 is right; making it the
  default penalizes the long tail of older devices.
- **Vietnamese, Korean, Mandarin localizations.** A11y plan recommends
  Vietnamese before French-CA based on TAM among independent operators.
  Worth the i18n refactor (`tt()` → `t(key)` lookup against
  `/i18n/{en,es,vi,ko,zh}.json`); defer to after Waves 1–4 prove the EN
  product first.
- **Margin Math direct overlay on Cost Pulse.** Mentioned in
  empowerment-insights plan; depends on Wave 1.1 SKU history landing first.

---

## 5. Test & validation plan

Per-wave fixtures and acceptance gates land alongside the code. The
existing `scripts/test-invoice-decoder.mjs` runner expands.

- **Wave 1**: new fixture buckets `perspective-tilt-30deg`,
  `shadow-glare-half`, `crease-fold`, `credit-and-deposit`,
  `multiline-description`, `pack-notation`, `multi-page-out-of-order`.
  Per-fixture metrics: line accuracy %, false-amber rate, wall-clock
  seconds. CI gate: ≥2pp regression on any fixture fails the build.
- **Wave 2**: capture-coach false-positive rate test on 50
  pre-recorded video clips (greasy lens, kitchen lighting, white
  tablecloth). Target ≤5% false-coach over 10s sustained signal.
- **Wave 3**: `npm run a11y` driving axe-core via Playwright + pa11y-ci
  + Lighthouse CI with `assert: { 'categories:accessibility': ['error',
  { minScore: 1.0 }] }`. Manual SR sweep across NVDA+Firefox,
  JAWS+Edge, VoiceOver+Safari iOS, TalkBack+Chrome Android. 200%
  zoom no-horizontal-scroll. Spanish lint regex blocks mixed-locale
  string concatenation.
- **Wave 4**: golden categorization set at
  `tools/invoice-decoder/__tests__/categorize.golden.json` — 200 rows
  across five vendors covering brand names, OCR-corrupted, abbreviations,
  ethnic specialty, ambiguous, multilingual ES, unit-only, full
  brand+packaging. Each entry `{ rawLine, expectedCategory,
  expectedTier, expectedTags, expectedConfidence: { min, max } }`.
- **Wave 5**: 5-operator usability test, $50 each, 30-min sessions. Script
  measures: time to first action, sample comprehension, retake-vs-push-
  through on a deliberately blurry photo, passphrase generation rate,
  next-day return-and-find-invoice friction. Plausible custom events
  instrument every step.
- **Wave 6**: Privacy Self-Check generates a signed report on every
  release; CI asserts the report shows zero non-allowlist requests.
  Service-worker-shipping-stale-Tesseract regression test on every PR.

---

## 6. Sequencing summary

| Wave | Theme | Eng-days | Calendar |
|------|-------|----------|----------|
| 1 | Capture math + owner insights (the killer features) | ~16 | 3-4 wks |
| 2 | Capture coach + perspective + vendor pulse | ~16 | 3 wks |
| 3 | Verification + a11y + microcopy | ~10 | 2 wks |
| 4 | Vendor coverage + categorization + accountant | ~25 | 3-4 wks |
| 5 | Onboarding + sample demo + error recovery | ~7 | 2 wks |
| 6 | Privacy hardening + PWA + dark mode + polish | ~25 | 3 wks |

Rough total: **~100 engineer-days** across **15–18 calendar weeks** for
one engineer. Two engineers in parallel (one on capture/parsing/vendors,
one on UX/a11y/onboarding) can compress this to ~10 calendar weeks. Each
wave is independently shippable; no coupling forces a big-bang release.

The biggest single value-creation moments, ranked, are: **1.1 per-SKU
drift**, **1.2 contract-price watch**, **2.1 capture coach**, **2.2
perspective rectification**, **4.6 accountant CSV**. Those five alone
move the tool from "OCR scaffolding" to "the invoice decoder you ask
your friend to try."

---

## 7. Brand commitments preserved

Every upgrade above respects the four claims that make this tool
credible:

1. **Image bytes never leave the device.** No engine, no integration, no
   cloud sync changes that. Email-forwarding intentionally rejected.
2. **No data pooling, no benchmark dataset, no ML training on cost data.**
   Per-SKU history, contract watch, and cross-vendor comparison all
   compute locally over the operator's own data only. USDA/BLS public
   overlays are acceptable because they ship *down*, never up.
3. **Verifiable by anyone with DevTools.** The Self-Check feature (6.6)
   makes verification one-tap and produces a signed artifact.
4. **Free. No subscription. No upsell.** Nothing in the plan introduces
   a paywall.

That's the moat. Everything else is craft.
