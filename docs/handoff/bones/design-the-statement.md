# The Closed-Month Statement — the deliverable Muntin actually sells (product repo: /insights/food-cost today; /close/[location]/[period]/v[N] proposed)

## Thesis
Muntin's product is a document, and right now it is a dashboard — which is why the board found it "does not exist as an object." The single design decision that resolves everything downstream is this: the close is a **ruled ledger sheet, not a card UI**, it renders identically on screen and on paper from one stylesheet, and it is the one surface in the product that deliberately breaks the dark-first canon and locks to paper-white — because a CPA prints it, a vendor rep reads it across a table, and financial documents in the world this artifact is trying to join are white. The rule weights carry semantics the reader already knows: a hairline under a column being added, a double rule under a final figure, which in bookkeeping literally means "this is the final number." Withholding is designed as **scoping, not silence** — we never withhold a number's parts because we cannot stand behind their ratio, so a withheld statement prints all four legs, the residual, every exception and every schedule, and declines exactly one division; that completeness is what makes the refusal read as rigor rather than as a broken product. The withheld verdict occupies the same position, same type size, same ink weight as a printed verdict, never a muted or disabled treatment, because muted means broken. Confidence dies here: `confidenceToNum` at `food-cost-client.tsx:30-32` invents 0.9/0.6/0.3 to feed a chip, which is fabricated precision on a company whose brand is not printing numbers it cannot stand behind — it is replaced by a measured coverage table the engine already computes. The verdict is a **sentence carrying its own numerator and denominator**, not a 5xl hero stat, so the number cannot be quoted without its terms. Every exception is a row with a receipt that opens the source PDF at the highlighted region — Muntin holds the pixels, which is a provenance move no citation-based competitor can make. The whole thing is one route, one ~200-line token-referencing CSS block, one glyph legend, and three `check-*.mjs` gates; no PDF renderer, no chart library, no chat, no generative UI. Taste in a document does not survive 108 agent sessions where 1 carries a CLAUDE.md; a gate does.

## Today
**The artifact does not exist. What exists is a three-tile dashboard that discards half the identity.**

- **Two of four legs are fetched and thrown away at render.** `apps/web/app/(product)/insights/food-cost/types.ts:6-7` declares `beginning_value_cents` and `purchases_value_cents`; `food-cost-client.tsx:114-129` renders only `used` / `onHand` / `netSales`. `Beginning + Purchases − Ending = Usage` cannot be said to foot when Beginning and Purchases are never drawn.
- **The residual is computable today and never computed.** `inventory-reconcile.ts:240-242` accumulates the three leg totals unconditionally; `:235` accumulates `usableUsageTotal` only when an item is valued at both ends. The gap between them IS the unexplained residual — it exists in the function's own locals and is discarded at `:315-333`.
- **Fabricated precision ships.** `food-cost-client.tsx:30-32` maps a `'high'|'medium'|'low'` band to 0.9/0.6/0.3 to satisfy `ConfidenceChip`'s 0–1 score. Those three numbers are inventions.
- **The genre is wrong.** `food-cost-client.tsx:107` — `text-5xl font-semibold` percentage, consumer-fintech vocabulary, on a document whose reader is looking for a reason to reject it.
- **Every exception collapses to one boolean.** `inventory-reconcile.ts:38-43` defines five typed cause codes and `ItemReconciliation.causes` carries them per item; `food-cost-client.tsx:160-165` renders one rust `Pill` reading "One number does not add up" (`copy.ts:118-120`) naming no item. Structured data drawn as an undifferentiated alarm.
- **`estimated` is computed and dropped.** `inventory-reconcile.ts:244-251` computes `estimated` per item and then contains a literally empty `if (estimated) {}` block with a comment explaining it is counted elsewhere. It is not.
- **"Show your work" exists in the wrong place.** `copy.ts:67-68` `showWorkTitle`/`showWorkLead`, rendered at `count-client.tsx:329` — inside the count flow, which the CPA never opens.
- **Printing is undesigned and explicitly disclaimed.** The only `@media print` block in the repo is `globals.css:1372`, whose own comment says the rules are "scoped so product surfaces (/today, /inbox) are unaffected — they are not printed in any honest workflow." There is **no `@page` rule anywhere in either repo** — no margins, no page size, no page numbering.
- **`lining-nums` appears zero times.** `tabular-nums` appears in ~10 scopes (`globals.css:176,772,806,861,921,1461,1887,1973,2068,2098`; `DataTable.tsx:172,194`); its lining partner is absent everywhere.
- **The good precedent already exists and is unused here.** `globals.css:2029-2076` (`.try-lines`) is a correct mono/tabular/hairline ledger table built for the marketing demo. `assets/site.css:468-483` (`.lib-idx`) is the storefront's mono-uppercase-microheader hairline index. Both are the right register; neither is applied to the close.
- **The plumbing for the receipt is already built.** `document-client.tsx:644-706` maintains a per-page bbox cache against `/v1/extractions/:id/bboxes?page=N`. A per-line "open the invoice at this region" link needs no new backend.
- **Signature/versioning infrastructure has a precedent.** `chain-head.ts:1-40` publishes ed25519-signed envelopes with a documented external verification path (`scripts/verify-chain-head.mjs`); `accountant-handoffs.ts:97-105` already implements owner-gated bearer-token share URLs. ADR-012 §3 specifies `version`/`superseded_by`/`signed_at`/`signed_by` (migration 0060) — proposed, unbuilt.
- **ADR-012 is Proposed and its walk receipt is damning by execution, not by reading:** case `R-02` returns `foodCostPct: 0` from a period where nothing can be valued — the product prints a 0.0% food cost from zero information.

## Proposal
## THE OBJECT

**The Close.** One canonical object, three representations at one address:

- `/close/[location]/[period]/v[N]` — the artifact of record. Permanent, addressable, immutable once signed. A superseded version stays live and stamps `SUPERSEDED BY v3 →` in its header rather than redirecting.
- The same DOM, printed. **US Letter portrait, `@page { size: letter portrait; margin: 18mm 16mm 20mm; }`**, page 1 standing alone as the negotiating instrument. No second renderer — the print stylesheet IS the design. (`services/pdfa-render` already exists behind `accountant-handoffs.ts:594-638` and can be pointed at this URL later for byte-stable archival; do not build that now.)
- `.json` and `.csv` at the same path. Identical content. The CSV is the CPA's import.

## PAGE ARCHITECTURE — descending commitment (ISA 700 ordering, not ISA 700 vocabulary)

One scrolling document on screen; `break-before: page` in print. Not tabs — tabs hide state and a document has no hidden state.

**Page 1 — THE STATEMENT.** Verdict sentence · the four legs and the residual · at most three actions · signature block. The owner stops here.
**Page 2 — BASIS & EXCEPTIONS.** Coverage table · exception rows with receipts · the method paragraph · the tickmark legend.
**Pages 3–N — SCHEDULE A: ITEMS.** Every catalog item, five figures, one basis token. The CPA's dismantling surface.

## THE VERDICT — a sentence, not a hero stat

Set in the display face at `clamp(26px, 3.2vw, 32px)`, weight 500, measure capped at 34ch. Carries its own terms inline so the figure cannot be quoted naked:

> **Food cost for July 2026 was 31.4% of net sales.**
> Usage 41,745.16 against net sales 132,940.00.

## THE WITHHELD STATE — the most important screen in the company

Same position. Same size. Same face. Same ink. **Never muted, never grey, never an icon, never a spinner.** The only status difference is a mono token in the header rule: `STATUS · WITHHELD` where a signed close reads `STATUS · SIGNED`.

> **Food cost for July 2026 is withheld.**
> Two invoices totaling 3,412.08 have not cleared review. Usage is not final until they do.
> **Usage so far: 41,745.16.**  ← the parts are never withheld with the ratio
> `[ Review 2 invoices → ]`

Three obligatory parts, in this order (the AVA finding — abstention reads as limitation without a repair path): **what is missing · why that blocks this specific number · the one action that clears it, as a real control.** `withheldReason` is a required field (ADR-012 §2); a withheld number with no reason is the product refusing to explain itself.

The design principle underneath: **withholding is scoped to the smallest defensible claim.** We decline the division, not the dividend. A withheld statement is a complete statement missing one line — all four legs, the residual, every exception, every schedule still print. That completeness is the entire reason it reads as integrity instead of breakage.

## THE IDENTITY BLOCK — how four legs visibly foot

Footing does not mean printing an `=`. It means the reader can perform the addition themselves. Therefore:

- Operators live in **their own narrow left gutter column**, never glued to the figures, so the numbers form one clean right-aligned stack the eye can add.
- **The `$` is set once as a column header glyph, never repeated per row** — a repeated dollar sign breaks digit alignment, which is the one thing that makes a column addable by eye.
- The hairline rule spans **only the number column**, not the row. The rule is the addition operator made visible.
- Double rule under Usage — in bookkeeping a double underline means "final figure," and the reader already knows it.
- The provenance annotation sits **inline, right of the figure**, not in a footnote (Wise's principle: the disclosure lives inside the calculation).

```
                                                    $
   Beginning inventory                      12,480.00   carried · close of 2026-06-30 v2  ✓
 + Purchases                                41,205.16   88 invoices · 3 exceptions        ∑
 − Ending inventory                         11,940.00   counted 2026-08-02 · 214 of 231   e
                                          ───────────
 = Usage — cost of goods used               41,745.16                                     ∑
                                          ═══════════
   Unexplained residual                          0.00   foots
```

**The residual line always prints, including at zero.** A reader must see that the check ran, not infer it from absence. Non-zero, it is followed immediately by the **named items** that account for it — names, never a count.

Tickmarks are audit-workpaper native and cost one superscript span plus a legend: `∑` footed · `✓` traced to source · `e` estimated at market price.

## COVERAGE, NOT CONFIDENCE

The risk-coverage table replaces every confidence affordance. Every figure below already exists in `reconcilePeriod`'s `coverage` object (`inventory-reconcile.ts:326-332`):

```
 BASIS
   Items in catalog                              231
   Counted                                       214    92.6%
   Estimated at market price                      11     4.8%   e
   Not counted — exposure 412.19                   6     2.6%
   Invoices in period                             88
     reviewed                                     86
     pending review                                2    3,412.08
   Net sales days settled                      30 / 31
```

No percentage of confidence appears anywhere on the close, ever. It is uncalibratable on zero users, and an uncalibrated percentage would be the one falsifiable-and-false number on a document whose brand is not printing numbers it cannot stand behind.

## EXCEPTIONS — rows with receipts, never a pill

Closed glyph vocabulary (Eurostat pattern), every glyph resolving in the page's own legend:

```
 EXCEPTIONS                                                            3

  ∆  line total disagreement    Baldor #88214 line 7          18.40   →
     Printed line total 312.40; 12.4 lb × 23.71 = 294.00. Catch weight.
     We used the printed total.

  ⊖  credit applied             Coastal CM-4419             (212.00)  →
     A credit memo reduced Purchases.

  ⧗  pending review             2 documents                3,412.08   →
     Usage is not final until these clear.
```

Each `→` opens the source document at the highlighted region. The bbox cache at `document-client.tsx:644-706` already serves this; no backend work. **This is the span-provenance move the frontier names, and Muntin can execute it where a citation-based product cannot — it holds the pixels.**

## NUMBER TYPOGRAPHY — the full specification

- **Face:** `var(--mun-font-mono)` (Geist Mono) on every figure on the close. Not the body face. In a numbers instrument, density reads as competence.
- **`font-variant-numeric: tabular-nums lining-nums`** — `lining-nums` currently appears zero times in the repo and must be added alongside every existing `tabular-nums` on this surface.
- **Alignment:** right, on one fixed column width derived from the largest figure in the statement, so decimals stack without `text-align: decimal` (unsupported).
- **Negatives are parenthesized, never signed:** `(212.00)`. Survives photocopy and fax, survives red-green colorblindness, and removes the leading-minus alignment defect. Color may reinforce; color never carries.
- **Zero prints `0.00`. A dash means "no observation." Blank never appears.** These are three different claims and get three different glyphs.
- **A withheld cell keeps its slot** — same column width, same baseline, same border. It fills with a lowercase mono token `withheld` at `--mun-text-tertiary` plus its cause glyph. Never a dash, never empty. **The hole has mass, because a hole reads as failure and a held position reads as a decision.**
- **Bands, where they occur** (market-priced items): `28.40–31.10` with an en dash, in-column, carrying `e`. Never `±`.
- **Percentages: one decimal, always.** `31.4%`. Two decimals claim a precision the count does not support.

## THE PHYSICAL OBJECT

It will be printed and slid across a table. That changes four things:

1. **Paper-white, locked.** `color-scheme: light` on the close route regardless of theme. This deliberately breaks the product's dark canon (`tokens.css:8-12`) and it is the one place that break is right.
2. **No fills, no shadows, no radii, no `Card`.** The only chrome is rules at three weights: hairline `--mun-divider`, medium `--mun-border`, and the double rule. A drop shadow does not print.
3. **`@page` with running identity:** `@bottom-left { content: "Muntin · Statement of Food Cost · Bethesda · July 2026 · v2" }` and `@bottom-right { content: "Page " counter(page) " of " counter(pages) }`. A page 3 that reaches a CPA's desk alone must still identify itself.
4. **`break-inside: avoid`** on every exception row and every identity leg. A footing that splits across a page break is not a footing.

## SIGNATURE

```
 ─────────────────────────────────────────────────────────────────
   Signed 2026-08-07 by Don Goldstein, Muntin.
   Statement v2 · supersedes v1 (2026-08-05)
   Reason: two invoices cleared review.
   Verify  muntin.digital/verify/close    sha256  3f9a…c21e
 ─────────────────────────────────────────────────────────────────
```

Typed attribution, a hash, and a verify URL — not a cursive signature image, which would be costume and would edge toward mimicking a CPA attestation. **The words "opinion," "audit," "assurance" and "attest" never appear on the artifact.** `Signed` · `Statement` · `Basis` · `Exceptions` · `Schedule` are the safe register and they carry the whole authority. The hash gives the CPA the only thing they actually need: proof the paper on their desk is the version that was signed.

## THE ONE AESTHETIC RISK, STATED PLAINLY

Locking the company's most important surface to paper-white, zero-fill, rule-only, in a product whose design canon is dark-first — and letting rule *weight* rather than color or fill carry the semantic load. If it lands, the close reads as an instrument from a profession that predates software, which is exactly the register a skeptical CPA relaxes into. If it misses, it reads as unstyled.

## Moves
- **Emit the residual. Add `identityResidualCents = beginningTotal + purchasesTotal - endingTotal - usableUsageTotal` to `PeriodReconciliation` and return it from `reconcilePeriod` (`inventory-reconcile.ts:315-333`).** [0.5h founder review; one line of engine change plus a close-corpus assertion]
  - The number already exists in the function's own locals — `:240-242` sum the legs unconditionally, `:235` sums usage conditionally, and the gap between them IS the unexplained residual. It is discarded at the return statement. This is the highest value-per-line change in the entire design: without it, 'the legs foot' is unprovable, and with it the identity block becomes drawable.
- **Replace the three-tile `<dl>` with the four-leg identity block: operator gutter, single `$` column header, hairline rule spanning only the number column, double rule under Usage, residual always printed including at zero, inline provenance annotation per leg.** [2h founder review (agent writes the component + CSS)]
  - `types.ts:6-7` already ships Beginning and Purchases over the wire and `food-cost-client.tsx:114-129` discards them. The API returns everything needed. A leg that is never displayed cannot be said to foot, and 'every leg foots on screen' is the sentence the company sells.
- **Build the verdict sentence and its withheld peer. Same position, size, face and ink for both; three obligatory parts on the withheld state (what is missing · why it blocks this number · the one control that clears it); the numerator always printed even when the ratio is withheld.** [2h founder review — the copy is a founder judgement, not an agent one]
  - This is the screen the brief calls the most important in the company and nobody has designed it. Withholding scoped to the ratio rather than the parts is what converts a refusal from a hole into a decision, and the repair path is the empirical difference between abstention read as rigor and abstention read as limitation.
- **Write the close's number typography as one token-referencing CSS block: mono face, `tabular-nums lining-nums`, one fixed right-aligned column, `$` as a column header only, parenthesized negatives, `0.00` vs `—` vs `withheld` as three distinct glyphs, withheld cells keeping full slot width and baseline.** [1h founder review; ~200 CSS lines, all token-referencing]
  - `lining-nums` appears zero times in the repo today. Alignment is not decoration in a money product — it is what lets an owner scan a column and catch the outlier, and it is the cheapest legible-craft signal available. `.try-lines` at `globals.css:2029-2076` is the correct in-repo precedent and can be lifted almost directly.
- **Replace the boolean `reconciliation_flag` Pill with typed exception rows: closed glyph vocabulary, one row per exception, the failing arithmetic shown, and a `→` opening the source document at its bbox region.** [2h founder review]
  - `inventory-reconcile.ts:38-43` already emits five typed cause codes per item and `food-cost-client.tsx:160-165` collapses all of it into one rust pill naming nothing. The exception looks like a defect because structured data is drawn as an undifferentiated alarm. The bbox cache at `document-client.tsx:644-706` means the receipt link needs no backend work.
- **Replace `ConfidenceChip` + `confidenceToNum` with the measured coverage table (counted / estimated / not-counted-with-exposure / reviewed / pending / sales days settled).** [1h founder review]
  - `food-cost-client.tsx:30-32` invents 0.9/0.6/0.3 to feed a chip that wants a score the snapshot does not have. That is a fabricated number on a company whose brand is not publishing numbers it cannot stand behind. Every replacement figure already exists in `reconcilePeriod`'s `coverage` object at `:326-332`.
- **Design the print artifact: `@page` with letter portrait, 18/16/20mm margins, running statement identity in the footer, page N of M, `break-inside: avoid` on every leg and exception row, `break-before: page` at the three section boundaries. Delete the scope restriction and the now-false comment at `globals.css:1372-1371`.** [2h — requires an actual printer, a physical check no agent can perform]
  - There is no `@page` rule anywhere in either repo, and the one print block explicitly declares that product surfaces 'are not printed in any honest workflow' — which is now false, because printing this document IS the workflow. A footing that splits across a page break is not a footing, and a page 3 that arrives alone on a CPA's desk must identify itself.
- **Add the signature/version block and the permanent URL: `/close/[location]/[period]/v[N]`, typed attribution, supersession pointer with a stated reason, content hash, and a verify link. Superseded versions stay live and stamp `SUPERSEDED BY` rather than redirecting.** [1.5h founder review; requires ADR-012's migration 0060]
  - ADR-012 §3 names this as the single choice that makes the close sellable rather than merely correct — it is how an audit opinion behaves and it is what lets a CPA rely on a document that might later change. `chain-head.ts` already establishes the signed-envelope-plus-external-verifier posture and `accountant-handoffs.ts:97-105` already implements owner-gated share URLs.
- **Build Schedule A — every catalog item with beginning / purchases / ending / usage and a basis token (`Invoice` · `Latest window cost` · `Prior count carry` · `Market estimate` · `Not counted` · `Dollars only`). Move `showWorkTitle`/`showWorkLead` here from `count-client.tsx:329` rather than duplicating them.** [1.5h founder review]
  - The basis column is the entire disclosure and today it is an aggregate count that is structurally wrong — `inventory-reconcile.ts:244-251` computes `estimated` per item and then contains a literally empty `if (estimated) {}`. 'Show your work' currently lives inside the count flow, which is the one surface the CPA never opens.
- **Ship three gates in the existing `check-*.mjs` family: `check-close-typography.mjs` (mono + tabular + lining on every numeric cell; no per-row `$`; no bare dash where a withheld token belongs), `check-close-legend.mjs` (every glyph on the page resolves in the legend and every legend entry is used), `check-withheld-has-reason.mjs` (`withheldReason` non-null wherever the percentage is null). Wire all three in the same commit.** [1h founder review]
  - ADR-012 §2 already declares `withheldReason` REQUIRED and nothing enforces it. Craft that lives in a document does not survive 108 sessions where 1 carries a CLAUDE.md; craft encoded as a gate does. The legend gate is the CPA workpaper rule — every workpaper carries its own legend — mechanized.
- **Publish one specimen close at a permanent storefront URL, with the numbers labeled illustrative under the fact gate, and point the four waitlist pages at it.** [1.5h founder review; the specimen must clear `check-fabrications.mjs`]
  - The board's finding is that the deliverable does not exist as an object. The cheapest disproof is one instance of the object that a stranger can read end to end. It is also the correct marketing asset under the emotional pivot — it shows the operator's document instead of arguing that Muntin is trustworthy.

## Retires
- `apps/web/app/(product)/insights/food-cost/food-cost-client.tsx` in its entirety — replaced, not supplemented. Specifically dead: the `text-5xl` percentage (`:107`), the three-tile `<dl>` (`:114-129`), `confidenceToNum` (`:30-32`), the `ConfidenceChip` + confLine cluster (`:130-144`), and the rust-Pill flag card (`:160-165`).
- `copy.ts` `foodCost.flagTitle` / `foodCost.flagBody` (`:118-120`) and the matching `count.flagTitle` / `count.flagBody` (`:66-68` region) — deleted, not kept alongside. Their job passes to the per-cause strings that already exist at `count.causeNegativeUsage` … `causeNoPriorCount`, which move to a shared `close.causes` namespace serving both surfaces. ES parity in `copy.es.ts` in the same commit.
- `copy.ts` `foodCost.confidenceHigh` / `confidenceMedium` / `confidenceLow` / `confidenceLabel` / `tightenCta` (`:110-114`) — deleted. Coverage replaces confidence on this surface entirely. `ConfidenceChip` itself survives only on the inbox, where it reflects a real extraction score.
- `copy.ts` `count.showWorkTitle` / `showWorkLead` (`:67-68`) MOVE out of the count flow (`count-client.tsx:329`) to Schedule A. Moved, not duplicated — the count surface loses the drawer.
- The scope restriction and the comment at `globals.css:1371-1372` asserting that product surfaces 'are not printed in any honest workflow.' That statement becomes false the moment this artifact exists and must not survive as documentation of a retired belief.
- The `foodCost.history` past-periods list (`food-cost-client.tsx:167-197`). A statement is a dated artifact at its own URL; a list of prior periods belongs at an index route (`/close`), not appended to the current statement. Retired from this surface.
- Any per-line or per-period numeric confidence display, present or planned, across the product. Bands plus a stated reason only. This forecloses a whole category of future work rather than deferring it.
- On the storefront: the pages that argue Muntin is trustworthy, superseded by one published specimen close. An instance of the object retires the argument for the object.

## Risk
**The honest failure mode is that this design makes wrong numbers beautiful.** Every move above is a render-layer and disclosure change; none of them fixes the engine. ADR-012's own walk receipt records, by execution rather than by reading, that case `R-02` returns `foodCostPct: 0` from a period where nothing can be valued — the product prints a 0.0% food cost from zero information — and that `R-13` reports `coverage.estimatedItems: 0` for a period valued entirely by WAC. If the statement ships before those engine defects land, this design gives a fabricated zero the typographic authority of a signed audit schedule, delivered to a CPA on paper with a verification hash attached. That is strictly worse than the dashboard it replaces, because the dashboard does not invite reliance. **Sequencing is therefore forced and non-negotiable: the six withhold conditions and the `usableUsageTotal` fix precede any of the eleven moves except M1.**

Two smaller risks worth naming rather than burying. **First, the paper-white lock is a real bet and it can miss** — rules and hairlines with no fills, no radii and no shadow, read as an instrument from a profession that predates software when the type is right and as unstyled HTML when it is not; the margin between those two outcomes is entirely in the rule weights, the column measure and the mono face's optical size, and there is no browser in this container to check it. **Second, the register borrows from audit practice while the company is not an assurance firm.** The tickmarks, the double rule, the descending-commitment ordering and the signature block are all deliberately CPA-native, and the more successfully they land the closer the artifact sits to something a reader could mistake for an attestation. The mitigation is lexical and absolute — `opinion`, `audit`, `assurance` and `attest` never appear — but a mitigation that lives in prose will not survive fifty agent sessions. It needs to be a line in `check-verboten-phrases.mjs` scoped to the close route, or it will drift.

**And the limit under all of it: no operator, CPA or bookkeeper has reacted to a single printed number in this product's history.** Every claim above about how a withheld statement *feels* is a designer's argument from convention, not a measured finding. The first real close will very likely print *Withheld* — the design treats that as success, and that judgement is itself the thing most in need of a reader.