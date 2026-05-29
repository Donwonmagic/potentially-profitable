# UX/UI Brief — Muntin Ledger `/privacy-forward` Landing + Article OG Image

Audience: the UX/UI specialist. Two deliverables, both supporting the content
bridge between `muntin.digital` and Muntin Ledger.

## A. Muntin Ledger `/privacy-forward` landing page

Pairs with the muntin.digital article (they reciprocally deep-link). Lives in
**Repo B**: `apps/web/app/(marketing)/privacy-forward/page.tsx` (Next.js 15 App
Router, the existing marketing surface).

- **Route:** `/privacy-forward` — deliberately distinct from the legal
  `/legal/privacy` policy and the existing claim-by-claim `/promises`.
- **Frame:** `<MarketingLayout width="prose">` (the 760px editorial width the
  trust pages use).
- **H1:** "What this ledger does with your numbers — and what it never does"
- **Lede:** "A digital ledger holds the most sensitive numbers a kitchen has:
  invoices, prime cost, the supplier list. Here is the mechanism behind each
  promise — read once, never resold, never trained on without your say-so,
  exportable as CSV whenever you ask."

**Sections (mirror the article's five "nevers" for entity reinforcement):**
1. Eyebrow + H1 + lede (match the `/promises` / `BookkeeperBody` opening).
2. **The five nevers** as numbered cards — reuse the `/promises` pattern (`01 / 05`
   mono prefix + glyph + a plain-English line + a "mechanism" line). Glyphs from
   `@muntin/ui` (lock / no-model / audit-trail / csv / reconcile). The five: never
   resell or broker · never train a model without consent · never pool into a
   benchmark without consent · never wall off export · never quietly widen access.
3. **"How to verify each yourself"** — a short "you can check this" section using
   the existing verify-chip pattern (`VERIFY_SLUGS` from `@/lib/verify-registry`;
   link `/verify/*` + `/.well-known/gpc`).
4. **"What we read once vs. never keep"** — reuse the two-column collect/never
   matrix from `/promises`.
5. **FAQ** — the five nevers as five Q&A (must be visible on-page to back the
   `faqPage` schema): "Does Muntin Ledger sell my invoice data?", "Do you train a
   model on my invoices?", "Are my numbers pooled into a benchmark?", "Can I
   export my data?", "Who can read my numbers?"
6. **CTAs:** `/sign-in` (primary), `/talk-to-us` (`/hablanos` in ES), `/promises`
   (deep trust) — match `BookkeeperBody`'s CTA row.
7. `<FunnelBeacon name="funnel.privacy_forward_view" />` at the foot.

**Reciprocal link (the SEO payload — don't skip):** in §1 or §3, link OUT to the
muntin.digital article →
`https://muntin.digital/library/privacy-forward-restaurant-bookkeeping/`. The
article links *in* to Muntin Ledger; this links back. That bidirectional citation
reinforces the "two properties, one entity" signal.

**Voice gate (`scripts/check-verboten-phrases.mjs`):** lead with the *mechanism*,
never the label. Banned include `privacy-first`, `we never train…`
negative-claim framing, `your data is safe with us`, `no AI`/`AI-free`,
`seamless`, `powerful`, and exclamation marks. ("privacy-forward" as a positioning
word is fine; verify against the live BANNED list.)

**Schema (reuse `lib/seo-schema.ts`):** `breadcrumbList` + `faqPage` (the same five
Q&A shown on-page) + an inline `Article`/`Organization` graph with
`publisher.url = https://muntin.digital`; add the article URL to a `sameAs` /
`citation` field so the structured data also encodes the A↔B relationship.

**Conventions to copy:** read `apps/web/app/(marketing)/promises/page.tsx` and
`apps/web/app/(marketing)/for-your-bookkeeper/page.tsx` for the card pattern, the
JSON-LD injection, and ES handling (cookie-based locale via `getCopy(locale)`;
pass `hasES: true` to `canonicalMetadata`).

## B. Article OG image (social card for the muntin.digital article)

- **Asset:** `/brand/og/library-privacy-forward-bookkeeping.png` — confirm the
  exact path/convention against the site's OG template grid
  (`scripts/check-og-template-grid.mjs`, `check-og-images.mjs`) and match the
  existing library-article OG style.
- **Spec:** 1200×630, brand-consistent (WindowMark + the type system). Motif: a
  ledger/privacy idea — vendor numbers held securely; calm, mechanism-first; no
  stock clichés. Must stay legible at small sizes (LinkedIn / Slack / iMessage).

## FYI — the article's in-page figures need no raster work
They are CSS-drawn `viz-*` blocks (no image assets): `viz-flow` (the five nevers),
`viz-ba` (extractive vs privacy-forward clause), `viz-tree` (the decision tree).
Listed only so you recognize them; brand-alignment review is welcome, but they
ship as code.
