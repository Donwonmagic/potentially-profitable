# Cost Index — Excellence Audit

Holistic audit of the Cost Index surface (the **Cost Pulse** dashboard at `/tools/cost-pulse/`,
its shared renderer `tools/_shared/cost-index-ui.js`, and the new methodology page at
`/cost-index/methodology/`), judged against one bar: **is this the most trustworthy, useful,
and AI-quotable public restaurant cost index that exists?**

Audited 2026-06-14 on branch `claude/muntin-invoice-decoder-audit-d7upo`. Baseline gate state:
`node scripts/check-all.mjs` = **180 / 181** (the single failure is the pre-existing
"Cost-index shippable bar" seafood issue — salmon-fillet, shrimp — out of scope here).

Findings are ranked by impact. Each is tagged **[APPLIED]** (done this session, safe + no
operator-data files touched), **[RECOMMEND]** (left as a documented recommendation — risky or
data-dependent), or **[OK]** (already excellent, noted so we don't regress it).

---

## What is already category-leading (do not regress)

The honesty machinery here is genuinely ahead of the field, and the audit should protect it:

- **A visible `absent` tier.** Most indices hide their gaps. This one renders "Not yet covered
  (N) — and why," with a structural reason per gap. That *is* the trust moat.
- **Tiers + dual confidence.** `measured` / `derived` / `absent` badges, plus a confidence chip
  whose `aria-label` carries a plain-language meaning ("Strong read — several sources agree"),
  not the jargon word alone.
- **Freshness as a non-color channel.** Solid dot vs. hollow ring on the sparkline endpoint, an
  "As of <oldest contributing date>" line, and a render-time staleness sentence — the static page
  self-signals age without a rebuild.
- **No-fetch + no-storage discipline,** stated on-page and independently verifiable in DevTools.
- **Honesty in the math copy:** never blends price types, softens the percent on a directional
  read, breaks the sparkline at gaps instead of bridging them, anchors percents to a dollar delta.

These are the differentiators. Everything below is about making them *legible to a reader and
liftable by an answer engine.*

---

## Tier 1 — highest impact

### 1. The dashboard never linked to the methodology page. **[APPLIED]**
Before: the just-published `/cost-index/methodology/` (and its ES mirror) had **zero inbound
links** from the dashboard or its renderer. The single strongest E-E-A-T / quotability asset on
the whole surface was an orphan. An answer engine reading the dashboard had no path to the
"citable and reproducible" claim the method page makes its thesis.

After: a prominent, locale-correct **"Read the full methodology →"** link added in two places —
(a) a static link in the hero data-promise block of `tools/cost-pulse/index.html` (+ ES mirror),
and (b) inside the renderer's *"How we read the market"* disclosure, so it travels with the card
wherever the card renders. Both point to `/cost-index/methodology/` (ES → `/es/cost-index/methodology/`).

### 2. Structured data did not connect the dashboard to its method or its sources. **[APPLIED]**
Before: the `WebApplication` node described the tool but exposed no machine link to the
methodology, no enumeration of the data sources as entities, and the FAQ had no "how is this
made / where can I read the method" answer — exactly the question an AI answer surfaces.

After (in `tools/cost-pulse/index.html` JSON-LD, mirrored to ES):
- `WebApplication.subjectOf` / `mainEntityOfPage` → the methodology `TechArticle`.
- A `TechArticle` node for the methodology page (`@id` = methodology URL `#methodology`), so the
  graph asserts a named, dated method behind the numbers.
- A new FAQ Q&A: *"How is the Cost Index calculated, and can I check the method?"* whose answer
  states the measured/derived/absent spine and links the methodology page — written so an answer
  engine can lift it verbatim.

### 3. No definitional anchor for "Cost Index" on the dashboard for AI lift. **[APPLIED]**
Before: the dek said "Wholesale and index signals…" but never gave the one-sentence, liftable
definition of *what the Cost Index is*, and there was no inline link to `/glossary/cost-index/`.
After: the renderer's method disclosure now opens with a single definitional sentence and links
the glossary term, giving answer engines a clean, attributable definition co-located with the data.

### 4. EN and ES loaded different renderer builds. **[APPLIED]**
Before: EN loaded `cost-index-ui.js?v=20260613-tier2`; ES loaded `?v=20260607-live10`. The
renderer is the *same shared, locale-aware file* — divergent cache-busts mean ES users could be
served a stale build of the exact same logic, silently breaking EN↔ES parity of the live surface.
After: ES aligned to `?v=20260613-tier2`.

---

## Tier 2 — strong improvements

### 5. The "As of" date is the *oldest* source, but that's only explained deep in a drawer. **[RECOMMEND]**
The card meta shows `As of <date> · N sources`. The fact that this date is deliberately the
**oldest contributing** date (a conservative, trust-positive choice) is explained in the learn
primer and method drawer, but a reader scanning the meta line could read it as "last updated."
Recommend: a small `title`/`aria` tooltip on the meta line's date itself ("the oldest source
behind this number — our most conservative date"). Low risk but touches per-card render ordering;
left as a recommendation to keep this pass surgical.

### 6. No `dateModified` / "index last refreshed" signal at the surface level. **[RECOMMEND]**
The page carries a `Last verified: June 6, 2026` tool-verified stamp, but there is no single
"the index data was last refreshed on X" line tied to the *data*, and the JSON-LD has no
`dateModified`. This is the freshness signal an answer engine most wants. The honest source for
this is `data/cost-index.js` / the health manifest (operator-owned, do not touch), so wiring it is
data-dependent. Recommend: have the seed expose a top-level `asOf` and have the renderer print a
"Market data refreshed: <date>" line above the cards, and mirror it into JSON-LD `dateModified`.

### 7. The methodology page should reciprocate with a Dataset/scope link. **[RECOMMEND — other team owns it]**
The method page links *out* to Cost Pulse, which is good. For maximum quotability the pair would
benefit from a `Dataset` JSON-LD on the methodology page (variableMeasured = wholesale price level
+ direction, measurementTechnique, isBasedOn the public sources). The methodology pages are owned
by another teammate this session — flagged, not edited.

### 8. Heading hierarchy on the dashboard is flat for the index section. **[RECOMMEND]**
The market card heading ("What the market's doing") is an `<h2>` rendered by JS, peer to the
saved-invoice cards. Per-ingredient cards are `<figure>`s with no heading element — fine for the
figure pattern, but it means an outline crawler sees one H2 and a wall of figures. The names *are*
the first span in each figure. Recommend (low priority): consider promoting each ingredient name to
an `<h3>` inside the figure for a cleaner machine outline; deferred because it risks the
article-graphics / figure conventions and needs a parity pass.

---

## Tier 3 — polish & accessibility

### 9. Confidence + tier color reliance — already mitigated, verified [OK].
Confidence and tier are conveyed by **text label + aria-label**, not color alone; the sparkline
uses dash vs. solid and ring vs. fill (grayscale-safe). WCAG 1.4.1 is satisfied. No change needed.

### 10. Tap targets — [OK]. `.cp-track`, `.cp-basket-clear`, note buttons all carry the
`min-height:24px` + inline-flex centering rule (WCAG 2.5.8). Verified in the page CSS.

### 11. The outlook overlay color (`#6b4fa1` purple on cream) — **[RECOMMEND]** verify contrast.
`.cp-market-outlook` uses `#6b4fa1` on the `--cream`/surface background. This is close to the 4.5:1
line for 12.5px text; worth a formal contrast check. The contrast gate passed at baseline, so it is
likely compliant, but the small size makes it the one to watch if tokens shift. Left as a watch item
rather than a change.

### 12. Sparkline `data-audio-alt` quality — [OK]. Every figure builds a full narration string
(name + range + trend + confidence phrase + meta + shape sentence + percentile + WoW + verdict),
comfortably over the 80-char bar, and the screen-reader table duplicates the numbers. Exemplary.

---

## Summary of what's missing to be *category-best*

1. **A surface-level "data refreshed on X" line** tied to the seed's own date (Finding 6) — the
   one freshness signal still missing at a glance and in JSON-LD. Data-dependent; recommended.
2. **A `Dataset` schema** on the methodology page (Finding 7) — turns the index from a described
   tool into a citable dataset. Owned by another teammate.
3. **A reciprocal, machine-readable method↔tool link in both directions** — half-applied this
   session (tool → method); the method → tool Dataset link is the remaining half.

Everything in Tier 1 has been applied. Tiers 2–3 are honest, scoped recommendations that either
depend on operator-owned data files or on pages another teammate owns, and were deliberately not
touched to avoid merge conflicts and regressions.
