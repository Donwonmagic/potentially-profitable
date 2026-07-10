<!-- Deep audit of Muntin Ledger — the product, its surfaces, its design language,
     its API, and a grounded critique of the /ledger/demo/ mockup. Written to
     ground a demo redesign (diagram the experience more fully, slow the motion,
     sharpen the type). Every feature/number below is quoted or traceable to a
     repo source file — no inventions. Sources in (parens). 2026-07-10. -->

# Muntin Ledger — deep audit (to ground the demo redesign)

**Why this exists:** we'd been iterating on `/ledger/demo/` without a grounded map of
the *actual* product it's supposed to express. This audit maps the product, every
surface, the design language, the API, and then critiques the demo against all of it —
with the founder's four asks in mind: (a) map it fully; (b) it can't fit everything;
(c) the keyframes are too fast; (d) the text/figures blend together; and diagram the
experience more deeply.

---

## 1. What Muntin Ledger *is* (source: `ledger/index.html`)

> "Your POS counts the sales. **Muntin Ledger reads the bills.**" (hero, l.527)

> "Muntin Ledger reads them [vendor invoices] the day they land, files them where you
> can find them, and tells you when a price moved." (lede, l.530)

- **The real app is external:** `https://ledger.muntin.digital/` — and it is **gated**
  (returns 403 to the public). `/ledger/` on muntin.digital is the *marketing* page;
  `/ledger/demo/` is a **mockup**. So the demo is the public's **only window** into the
  experience before they join — this is exactly why "diagram it more deeply" matters.
- **GA:** November 13, 2026 (l.525, l.641). Free in private beta until then.
- **Pricing (posted in writing):** founding rate = **three months free, then $19 a month
  per location, for as long as you stay** (l.636, l.640).

## 2. The three jobs — Read · File · Flag (source: `#what`, l.589–609)

| Job | Headline (verbatim) | The substance |
|---|---|---|
| **Read** | "Templates and rules, not a model." | Snap/upload a vendor invoice → pulls **vendor, item, quantity, price, tax**. "No language model ever reads your documents; a CI gate blocks anyone from adding one." |
| **File** | "A ledger you can search." | Filed + searchable **by vendor, by item, by date**. "Export the whole record to a clean **CSV**, or post it to **QuickBooks Online**, whenever you ask." |
| **Flag** | "Price hikes, against your own history." | Marks a raise against your **own six-month history**. "The dishes that ingredient touches **re-cost the same day** — the plate-cost number stays current without a spreadsheet." |

**Scope honesty (l.609):** files *any* vendor invoice (food or beverage) and flags a hike
against your own history no matter what; telling a *vendor's* raise from a *whole market*
moving leans on the **Cost Index** (wholesale proteins, produce, dairy — **not** spirits/
wine, **not** graded/specialty cuts). Outside that set a raise still files + re-costs, it
just isn't market-checked yet.

## 3. Why a platform can't copy it — the four asymmetries (source: `#why`, l.612–620)

These are the **strongest differentiators and the demo shows none of them**:

1. **No per-order rake** — "Muntin takes nothing off your tickets."
2. **No language model in the invoice path** — "a **build gate** that fails the release
   if anyone tries to add one." (The demo's own honesty copy already leans on this.)
3. **Your data stays yours** — export anytime in an open format; "Delete it and it's gone."
4. **Pricing posted in writing** — the number + per-invoice cost math on the page; "No
   call, no quote, no 'contact sales.'"

## 4. Proof + conversion (sources: `#proof` l.623, `#pricing` l.632, `data/ledger-cta.json`)

- **Proof before trust:** the free **plate-cost + margin tools** compute the same numbers
  in-browser (no signup), and the **Cost Index** publishes the dated/sourced wholesale reads
  behind them. CTAs: "Browse the tools" `/tools/`, "Read the index" `/cost-index/`.
- **Conversion:** the founding-list form (email + name, Turnstile) → `POST /api/waitlist`.
- **Site-wide funnel:** `data/ledger-cta.json` stamps an end-of-article "and here is the
  product" CTA into **library posts, EN+ES** (e.g. *toast-vs-square*: "Your POS rings sales.
  This files the bills."). Copy is constrained to "only what Muntin Ledger's own pages
  already state" — a good honesty precedent for the demo.

## 5. Every surface the Ledger touches

1. **`/ledger/`** — the canonical product/marketing page (feature source of truth).
2. **`/ledger/demo/`** — the mockup walkthrough (this audit's subject). ES mirror at `es/`.
3. **`ledger.muntin.digital`** — the real app, **gated** (public can't see it).
4. **End-of-article CTA** — `data/ledger-cta.json` → ~24 library posts × EN/ES.
5. **Founding-list capture** — `POST /api/waitlist` (the conversion event).

## 6. The design language the demo must speak (sources: `ledger/index.html` + demo CSS)

- **Tokens:** `--teal #2A50C8`, `--rust #C42E2E`, `--ink`, `--ink-soft`, `--stone`,
  `--cream-2`, `--teal-tint`, `--status-bad-tint`. Display face **Fraunces** (`serif-italic`);
  body **Inter**. Motion tokens: `--t-micro 120ms`, `--t-fast 180ms`, `--ease-out`, `--ease-spring`.
- **The `.lg-*` family is SHARED** between the product hero and the demo — same components:
  `lg-vignette`, `lg-sheet` (the "paper-behind" ledger-stack cue), `lg-pane`/`-head`/`-title`,
  `lg-chip` (illustrative badge), `lg-rows`/`lg-row`/`lg-row--flag`, `lg-n` (display numerals),
  `lg-d/v/i/s` (date/vendor/item/status fields), `lg-flag` (rust "price moved" pill), `lg-step`
  SVG spark, `lg-stepnote`, `lg-cap`, `lg-scope`, and the `lg-price-*` lockup.
- **Canonical example is immutable across both surfaces:** the romaine trio
  **$24.10 → $24.35 → $29.45**, **▲$5.23 / +21.6%** over the **$24.22** trailing median —
  it clears the co-gate (≥8% AND ≥$5.00). The product hero vignette and the demo climax are
  the *same* figure; both `arm→land` at 480ms.
- **The demo adds an `.ld-*` "app-frame" layer:** the fixed `#ldPanels` stage, `ld-panel`
  cross-fade, sticky control bar, progress fill, and the cycle-2 `.ld-ghost` FLIP.

## 7. The API — what's real vs. mocked (source: `src/worker.js`, `wrangler.jsonc`)

- The repo's Cloudflare Worker (`src/worker.js`, ~18.5K LOC across `src/lib/`) serves the
  **marketing-funnel** APIs only: `/api/waitlist` (founding list), `/api/window/*` (the
  contact "Window"), `/api/intake|checklist|audit-report|audit-snapshot` (the free audit
  tool), `/api/auth/*` (magic-link), `/api/course/*`, `/api/gbp-lookup`, `/api/og-snapshot`.
  Bindings: `AUDIT_SNAPSHOTS`, `AUTH_SESSIONS`, `WINDOW_ATTACHMENTS`.
- **The Ledger invoice-reading API is NOT in this repo** — it lives behind the gated app.
  So the demo *must* be a mockup, and its honesty rails ("Canned sample, on purpose … fires
  no requests of its own", l.1026; "not live controls", l.1109) are accurate and **must stay**.

---

## 8. The demo, audited against all of the above (`ledger/demo/index.html`)

### 8a. What it currently diagrams — 5 beats
`The invoice arrives.` → `Read.` → `File.` → `Flag.` → `Put this flag on every line.` (CTA).
It nails the **core loop** and the climax. What it **omits** (candidates to "diagram more
deeply"): the **QuickBooks Online** post (File names CSV but not QBO); the **same-day plate
re-cost** (the "so what" — a *dish* number moving); the **Cost-Index market-check** (vendor
raise vs. whole market); and **all four asymmetries** — especially the **no-LLM / build-gate**
privacy proof, which is the product's single strongest claim and currently invisible.

### 8b. Motion is too fast for human consumption ✅ (your note — confirmed, with specifics)
The reveal beats run on the `120 / 180 / 240ms` micro/fast tokens with short staggers:
- **Panel cross-fade:** `--t-fast` = **180ms**.
- **Ghost FLIP (signature):** **240ms** travel + 120ms opacity.
- **Flag-land chain (the climax):** move-line **120ms** → dot pop **360ms** → label **480ms**
  → pill **600ms** — the whole payoff resolves in **~0.7s**, faster than the eye can follow it
  as a story.
- **Step-1 scan:** staged reveals at 120–480ms.
Reading-oriented motion wants ~**300–500ms** per beat with a **hold** before the next; the
current 120–240ms transitions read as a flicker, not a walkthrough. **Recommendation:** slow
transitions ~**1.5–2×**, lengthen the climax stagger, and add dwell so each beat lands before
the next begins. (Keep it all compositor-only + reduced-motion-safe, per the FLOOR.)

### 8c. Text and figures blend together ✅ (your note — confirmed, with specifics)
A ledger row stacks **five** fields — `lg-d` (stone), `lg-v` (ink-soft), `lg-i` (ink),
`lg-n` (ink display), `lg-s` (stone) — at **10–13.5px**, differentiated almost entirely by
**three near-gray tones**, not by size or weight. On mobile they compress to **10.5–11.5px**
(and the cycle-4 tightening pushed the pane title to 12.5px, ~1px above the 11.5px caption —
a flagged hierarchy compression). The only strong element is the display numeral; item,
vendor, date, and status all read as one gray band. Chart axis labels (`lgc-lab`) are 11px
stone. **Recommendation:** rebuild the hierarchy on **size + weight + color**, not color
alone — lift the **item** and the **number**, give the **status** (filed/flagged) a distinct
weight/hue, raise row line-height/padding, and floor the smallest mobile sizes higher.

### 8d. Honesty rails to preserve (non-negotiable)
Immutable numbers ($24.10/$24.35/$29.45, $24.22, ▲$5.23/+21.6%, thresholds, $115.80, $19/mo,
Nov 13 2026, the GA-weeks sentinel); the "illustrative / canned sample / fires no requests"
labels; EN↔ES byte-parity; the no-scroll / no-bounce / no-overflow FLOOR.

## 9. Redesign directions (for the next cycle, not yet applied)

1. **Diagram the experience, beat by beat, with the real artifact at each step** — a
   real-looking invoice; extracted rows with *field labels* so Read reads as parsing; a
   searchable ledger with a visible **CSV / QuickBooks** export; the flag with the
   **Cost-Index market-check**; and the **plate re-cost** as the payoff. Consider one beat
   for the **no-LLM/privacy** proof (the top differentiator) — within the no-scroll budget.
2. **Slow the motion** to a human reading pace (§8b).
3. **Sharpen the type** so every word and figure is defined (§8c).
4. Keep every honesty rail (§8d).

*This document is the grounding for the demo redesign; it does not itself change the demo.*
