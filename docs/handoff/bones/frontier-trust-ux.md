# Trust & Financial UX — designing the closed month, the exception, and the correction

## Thesis
The frontier in trust-critical financial UX is not "look credible" — it is **make the reader able to disprove you cheaply**, and the professions that have solved this solved it a century before fintech. Three conventions dominate and all three are structural, not decorative: (1) **verdict first, evidence after** — ISA 700 (Revised) moved the auditor's opinion from the end of the report to immediately after the addressee precisely because burying the conclusion behind boilerplate is a user-hostile layout; SOC 2 keeps the same order (opinion → assertion → description → tests and results), so the skeptic reads the claim, then the accountability, then the method, then the raw test evidence, and can stop at any depth. (2) **A closed vocabulary for what a number is** — Eurostat/SDMX ships observation-status flags (p provisional, e estimated, f forecast, i imputed, u low reliability, b break in series) and a separate confidentiality list (C confidential, N not for publication), plus ":" for not-available; the point is that a withheld or estimated cell is a *typed, legend-backed state*, not an error, and every table carries the legend. Audit workpapers do the same at the cell level with tickmarks — ∑ footed, ✓ traced to source — and the iron rule is that **every workpaper carries its own legend**. (3) **Revision and correction are different objects** — ONS/NISRA policy separates a scheduled *revision* from an unplanned *correction* caused by an error, and requires the correction be labelled as such; Crossref goes further and says an editorially significant change should get its **own document with its own DOI**, because in-situ edits "obscure the scholarly record." Modern fintech's contribution is narrower but real: Wise's trust comes from putting the number a competitor hides (the fee, the mid-market rate) *inside the calculation itself* rather than in fine print; Stripe's revenue-recognition surface makes every aggregate a drill-down to the rows it came from. The honest counterweight: the evidence that transparency *itself* builds trust is weaker than the industry assumes — the research on expanded audit reports (KAMs) is genuinely mixed, and Nyhan's work found corrections increase belief accuracy while *decreasing* trust in the corrector. That is the design problem, not a reason to hide: a correction read as an admission damages you, a correction read as **the system working as designed** does not, and the difference is entirely whether the correction arrives inside a pre-declared, dated, routine apparatus or as a one-off apology. Muntin's product already computes everything this requires and throws most of it away at the render layer — the gap is not engineering, it is that two of the four legs of the identity are fetched and never drawn.

## Findings
### Put the verdict first, the method after. ISA 700 (Revised) mandates the Opinion section immediately after the addressee — before scope, responsibilities, and boilerplate — reversing the pre-2016 layout that buried it at the end. SOC 2 Type 2 uses the same descending-commitment order: independent auditor's opinion → management's assertion → system description → tests of controls and results.
- **Who:** IAASB (ISA 700 Revised); AICPA SOC 2 reporting structure
- **Why:** A skeptical reader needs to know the conclusion before they will spend attention on the method, and a reader who trusts you needs to be able to stop early. Ordering by descending commitment lets one document serve the owner (stops at the verdict) and the CPA (reads to the test results) without producing two documents.
- **Confidence:** well-established

### Give every number a typed status flag from a closed, legend-backed list, and treat 'unavailable' as a first-class value with its own symbol. Eurostat/SDMX publishes Obs_status (p=provisional, e=estimated, f=forecast, i=imputed, u=low reliability, b=break in series, d=definition differs, n=not significant) and a separate Conf_status (C=confidential, N=not for publication), with ':' rendered where an observation does not exist.
- **Who:** Eurostat / SDMX statistical dissemination standard
- **Why:** A withheld or estimated cell stops reading as a bug the moment it carries the same typographic weight as a real value and resolves to a published legend. The separation of *observation* status from *confidentiality* status also matters: 'we could not measure it' and 'we will not publish it' are different promises and must not share a glyph.
- **Confidence:** well-established

### Tickmarks with a per-page legend: mark each figure with what was done to it — ∑ 'footed' (columns re-added), ✓ 'traced to source', with the specific source named ('traced to cash receipts journal', not 'traced'). Every workpaper carries its own legend at the bottom; nothing relies on the reader knowing the firm's house symbols.
- **Who:** Standard CPA audit workpaper practice (tick-and-tie)
- **Why:** This is the profession's native answer to 'show your work' and the exact idiom Muntin's CPA reader already reads fluently. It is also cheap: a superscript glyph plus a footer legend, no drill-down UI required, and it degrades to print and PDF perfectly.
- **Confidence:** well-established

### Separate a scheduled REVISION from an unplanned CORRECTION, publish the policy in advance, and label corrections as corrections. Where a known error is deliberately held to the next scheduled release, say so transparently rather than silently.
- **Who:** UK Office for National Statistics / NISRA 'Revisions and Corrections' policy under the Code of Practice for Statistics; ONS updated its consumer-prices policy in Dec 2025 after user feedback on an April 2025 error
- **Why:** Pre-declaring the machinery converts each individual correction from an admission into an instance of a routine. That is the mechanism that defuses the corrections-trust penalty: the reader is not being asked to forgive, they are watching a published process execute.
- **Confidence:** well-established

### A significant correction gets its own dated document with its own identifier, linked bidirectionally to the original, rather than an in-situ edit. Crossref/Crossmark explicitly discourages changing a document in place because it 'obscures the record'; the Crossmark button gives a reader one-click access to whether what they are holding is current.
- **Who:** Crossref / Crossmark; COPE correction-and-retraction standards
- **Why:** Directly applicable to a signed monthly close: an amended February statement must not overwrite the February statement a CPA already filed a return against. The amendment is a new artifact; the original stays retrievable and stamped 'superseded by'.
- **Confidence:** well-established

### The evidence that disclosure builds trust is genuinely mixed — design accordingly. Research on expanded audit reports (Key Audit Matters) shows some markets responding (higher abnormal volume, lower price synchronicity post-adoption in China) and a substantial archival body finding no effect on audit outcomes or investor decisions. Separately, Nyhan et al. found media retractions increase belief accuracy but decrease audience trust in the source.
- **Who:** Auditing: A Journal of Practice & Theory (KAM informativeness, China); multiple EU/UK KAM studies; Brendan Nyhan (Dartmouth), reported via Nieman Lab 2023
- **Why:** Prevents the naive conclusion 'publish more and be trusted more.' Disclosure earns trust when it is *decision-useful and specific* (this item, this cause, this remedy) and costs trust when it is generic self-narration. It is the argument for naming the flagged item and against a page that talks about how honest Muntin is.
- **Confidence:** reported

### Show the number a competitor hides, inside the calculation rather than beside it. Wise puts the fee and the mid-market rate into the transfer calculator itself so the user watches send-amount become receive-amount; the design argument is 'fairness is demonstrated, not claimed.'
- **Who:** Wise (TransferWise)
- **Why:** Directly transferable to the estimate/withheld problem: an estimate defended in a footnote reads as a caveat; an estimate shown as a labeled line *inside* the arithmetic that produces the total reads as rigor. Position, not wording, does the work.
- **Confidence:** reported

### Every aggregate is a drill-down to the rows that produced it. Stripe's revenue-recognition surface lets an accountant click an amount and get the itemized customers/transactions behind it; the reconciliation reports exist specifically so a number can be tied out to source.
- **Who:** Stripe (Revenue Recognition / Sigma, 'Audit your numbers' documentation)
- **Why:** The CPA test of a statement is not whether it is pretty but whether any figure can be walked to its constituents in under a minute. A total with no path down is unauditable regardless of how it is typeset.
- **Confidence:** well-established

### High information density is a trust signal in professional tools, not a usability failure. The Bloomberg Terminal's density and religious visual consistency ('you can see a Bloomberg from a mile away') are cited by its own leadership as a status and retention asset; the design literature frames dense interfaces as ones that 'show you everything and trust you to figure it out.'
- **Who:** Bloomberg LP; high-information-density design literature
- **Why:** Counterweight to consumer-fintech minimalism. A closed month read by a CPA should look like a working document, not a marketing dashboard — the 5xl single percentage currently dominating Muntin's food-cost page is the consumer pattern, and it is the wrong genre for the reader who decides whether to recommend the product.
- **Confidence:** reported

### Tabular figures, right alignment, decimal alignment, and no centering for numeric columns. Numerals must be tabular (font-variant-numeric: tabular-nums / 'tnum') so digit columns line up; numbers right- or decimal-aligned so magnitude is scannable; centering is specifically called out as preventing quick detection of irregularities.
- **Who:** Standard typographic/table-design practice (A List Apart, Matthew Ström, science-editing table standards)
- **Why:** Misalignment is the cheapest possible credibility leak: a reader cannot spot an order-of-magnitude error in a ragged column, and subconsciously reads a wobbling column as amateur work. Muntin's product already applies tabular-nums in globals.css and packages/ui/tokens.css — the discipline exists and simply needs to reach the closed-month artifact.
- **Confidence:** well-established

### Trust artifacts (status, security, transparency, changelog) now function as independent reputation surfaces that people reach before the homepage — and they fail when they are curated. The distinguishing test of genuine vs performative is whether the negative is published alongside the positive; selective disclosure is described as potentially more damaging than opacity.
- **Who:** Trust-page / transparency-reporting practice literature; Trust & Safety Professional Association transparency-report guidance
- **Why:** Argues against Muntin building a 'why trust us' page and for building a page that publishes the uncomfortable measurement — the count of periods that flagged, the count of statements amended, the share of items valued at market prior rather than invoice. A trust page whose numbers can only go up is read as marketing.
- **Confidence:** reported

### Include the original error inside the correction so the reader can judge both. The NYT states the mistake in the correction notice rather than only the corrected fact, and maintains a single durable corrections index.
- **Who:** The New York Times corrections practice
- **Why:** A correction that only states the new truth asks for trust; a correction that states what was wrong, what is right, and when it changed lets the reader verify the fix themselves. For Muntin's 72 published falsehoods, this is the difference between quietly editing 72 pages (which is indistinguishable from covering them up) and shipping one dated, indexed corrections register.
- **Confidence:** well-established

## For Muntin
- TRANSFERS — and it is nearly free: the closed month does not currently foot on screen. `apps/web/app/(product)/insights/food-cost/types.ts:6-7` declares `beginning_value_cents` and `purchases_value_cents`; grep across `apps/web/**/*.tsx` returns zero render references to either. `food-cost-client.tsx:113-127` draws only `used`, `onHand` and `netSales` under a 5xl percentage. Two of the four legs of `Beginning + Purchases − Ending = Usage` are fetched over the wire and discarded at the render layer. The single highest-leverage change in this entire brief is drawing four rows and a rule instead of three tiles — the API already returns everything.
- TRANSFERS: the tickmark legend, at essentially zero maintenance cost. Render the identity as an audit schedule — Beginning / + Purchases / − Ending / = Usage, right-aligned tabular figures, decimal-aligned, a hairline rule above the derived line — with superscript marks (∑ footed, ✓ traced to invoice, e estimated at market prior) and a legend block underneath. This is one component, it prints, and it is the exact idiom the CPA reader already reads. `globals.css` and `packages/ui/tokens.css` already carry `font-variant-numeric: tabular-nums`, so the typographic half is done.
- TRANSFERS: the Eurostat flag vocabulary maps onto code that already exists. `inventory-reconcile.ts:41-47` defines five typed cause codes — `negative_usage`, `no_valuation`, `not_counted`, `purchases_pending_review`, `no_prior_count` — and `ItemReconciliation.causes` carries them per item. The snapshot layer then collapses all of it into a single boolean `reconciliation_flag`, and the UI renders one rust Pill with `copy.ts:62-64` ("One number does not add up" + "We flag it; we do not change it"), naming no item. The exception looks like a defect because it is drawn as an undifferentiated alarm over structured data. Fix: surface the note list, one line per item, cause-typed, each with the arithmetic that failed — five flag *types* with a legend, not one red pill.
- TRANSFERS: opinion-first ordering for the statement itself. Structure the closed month as Statement (the dated verdict and the four legs) → Basis (coverage: counted N of M, estimated N, pending review N — already computed in `reconcilePeriod`'s `coverage` object) → Exceptions (the typed notes) → Schedules (per-item drill-down). The owner stops after Statement; the CPA reads to Schedules. One artifact, two readers, no second product.
- TRANSFERS: 'Show your work' already exists in the wrong place. `copy.ts:67-68` defines `showWorkTitle`/`showWorkLead` and `count-client.tsx:329` renders it — inside the count flow, which the CPA never opens. The drawer belongs on the closed-month surface, per item, per leg.
- TRANSFERS across repos: the storefront has built a provenance apparatus the product lacks — 95 HTML files carry `<details class="cite">` drawers, and `scripts/build-cost-index-provenance.mjs`, `build-cost-index-reproduce.mjs` and the `Cite this edition` block (`build-cost-index-dispatch.mjs:845`) exist. The closed month has no equivalent. Port the pattern, not the code: a per-statement 'Cite this close' block with the period, the generation timestamp, the basket of sources, and a stable identifier.
- TRANSFERS: the correction apparatus, and it must be built BEFORE the 72 corrections are made, not after. Adopt the ONS distinction (scheduled revision vs unplanned correction) and the Crossref rule (a significant change is a new dated artifact, not an in-situ edit). Concretely: publish `/corrections/` as a dated, append-only register — one entry per claim, stating what was published, what is true, and when it changed, per NYT practice — and only then edit the pages, each linking to its register entry. Doing the edits first makes 72 quiet rewrites indistinguishable from a cover-up, and forfeits the single largest trust asset the company currently owns.
- TRANSFERS: `no-llm-ci.sh` exists at `Muntin-Invoice-Decoder/scripts/no-llm-ci.sh` and is named on zero storefront HTML pages, while 89 pages contain the string 'no language model' (the brief says 93; I measured 89 with that exact phrase today — variants likely account for the delta). This is a proof asset being described instead of exhibited. Per the Wise principle, the falsifier belongs *inside* the claim, not beside it: the sentence should carry the command a stranger can run.
- DOES NOT TRANSFER: the consumer-fintech aesthetic. Mercury/Ramp/Brex hero-dashboard patterns, the giant single number, the reassuring loading state — these are designed for an anxious consumer making a fast decision. The closed month's reader is a CPA looking for a reason to reject it. The Bloomberg lesson applies instead: density reads as competence in a professional tool. The current 5xl percentage is genre-wrong.
- DOES NOT TRANSFER: 'transparency' as a page about Muntin. The KAM evidence is mixed and the Nyhan finding is that corrections can reduce trust in the corrector — generic self-narration does not buy credibility, and this collides directly with the founder's own EMOTIONAL PIVOT (stop making the site defend itself). Build the register, the legend and the drill-down; do not build a page explaining how honest the company is.
- DOES NOT TRANSFER: SOC 2 / attestation *branding*. The report structure is a superb layout model, but Muntin is not an assurance firm and must never let a closed month be mistaken for a CPA attestation — the word 'opinion' and any audit-report typographic mimicry are a real liability. Borrow the ordering; do not borrow the vocabulary of independent assurance.
- WHAT THIS RETIRES (required by the brief; the company is 2-4x over capacity): (a) the three-tile summary in `food-cost-client.tsx` is replaced, not supplemented — four legs and a rule, the tiles go; (b) the boolean `reconciliation_flag` Pill is retired in favour of the typed note list, and `copy.ts` `flagTitle`/`flagBody` are deleted rather than kept alongside; (c) `showWorkTitle`/`showWorkLead` move out of the count flow rather than being duplicated onto the statement; (d) on the storefront, the 89 pages asserting 'no language model' should shrink to the small set that actually carries the runnable falsifier — the assertion is retired everywhere it cannot be proved on the page. Every one of these is a deletion plus a component, which is the only shape of work that fits 13-26 hours/month.
- HONESTY LIMIT ON THIS RESEARCH: two primary sources I wanted were blocked by the egress proxy (niemanlab.org for the Nyhan corrections study, docs.stripe.com for 'Audit your numbers'), so those two findings rest on search-result summaries and are marked 'reported' / secondary. All repo facts in this list I verified by reading the files today and are marked 'verified'. No statistic here is estimated or invented; where the brief's number and my measurement differ (93 vs 89 pages) I have reported both.

## Sources
- https://www.iaasb.org/publications/international-standard-auditing-isa-700-revised-forming-opinion-and-reporting-financial-statements
- https://www.irba.co.za/upload/ISA-700-Revised.pdf
- https://publications.aaahq.org/ajpt/article/43/3/139/11973/Informativeness-of-Key-Audit-Matters-Evidence-from
- https://www.tandfonline.com/doi/full/10.1080/00014788.2021.1932264
- https://www.sciencedirect.com/science/article/abs/pii/S0278425425000304
- https://eurostat.github.io/flagr/articles/flagr_introduction.html
- https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-faq/tsv-format
- https://www.nisra.gov.uk/statistics/results/revisions-and-corrections-policy
- https://www.ons.gov.uk/aboutus/transparencyandgovernance/statementofcompliancewiththecodeofpracticeforstatistics
- https://www.crossref.org/documentation/principles-practices/best-practices/versioning/
- https://www.crossref.org/documentation/register-maintain-records/maintaining-your-metadata/registering-updates/
- https://www.accountingtools.com/articles/what-are-audit-tick-marks.html
- https://www.suralink.com/blog/tick-and-tie
- https://www.superfastcpa.com/what-are-audit-tick-marks/
- https://schneiderdowns.com/our-thoughts-on/breakdown-of-a-soc-2-report/
- https://certpro.com/soc-2-type-2-report-structure/
- https://docs.stripe.com/revenue-recognition/reports/audit-numbers
- https://docs.stripe.com/stripe-data/access-data-in-dashboard
- https://raw.studio/blog/how-wise-uses-3-transparency-first-ux-principles/
- https://uxmag.com/articles/the-impossible-bloomberg-makeover
- https://www.bloomberg.com/company/stories/how-bloomberg-terminal-ux-designers-conceal-complexity/
- https://www.lippihom.com/blog/designing-for-cognition-the-enduring-value-of-high-information-density-interfaces
- https://alistapart.com/article/web-typography-tables/
- https://medium.com/mission-log/design-better-data-tables-430a30a00d8c
- https://www.csescienceeditor.org/article/best-practices-in-table-design/
- https://www.niemanlab.org/2023/03/the-corrections-dilemma-admitting-your-mistakes-increases-accuracy-but-reduces-audience-trust-a-new-study-finds/ (BLOCKED by egress proxy — cited via search summary only)
- https://newscollab.org/2020/05/04/fixing-our-mistakes-in-public/
- https://ethicsandjournalism.org/resources/best-practices/best-practices-corrections/
- https://www.tspa.org/curriculum/ts-fundamentals/transparency-report/
- https://www.reputation-insider.com/trust-pages-are-becoming-reputation-infrastructure/
- https://www.bls.gov/bls/quality.htm
- REPO (verified today): /home/user/Muntin-Invoice-Decoder/apps/web/app/(product)/insights/food-cost/types.ts:6-7
- REPO (verified today): /home/user/Muntin-Invoice-Decoder/apps/web/app/(product)/insights/food-cost/food-cost-client.tsx:113-127, 158-164
- REPO (verified today): /home/user/Muntin-Invoice-Decoder/apps/api/src/lib/inventory-reconcile.ts:1-135 (identity, ReconcileCause, coverage, withheld foodCostPct)
- REPO (verified today): /home/user/Muntin-Invoice-Decoder/apps/web/lib/copy.ts:62-68, 110-123
- REPO (verified today): /home/user/Muntin-Invoice-Decoder/packages/ui/tokens.css:1-23; apps/web/app/globals.css:168-177, 1418-1462
- REPO (verified today): /home/user/Muntin-Invoice-Decoder/scripts/no-llm-ci.sh (exists); /home/user/potentially-profitable — 0 HTML files name it, 89 contain 'no language model'
- REPO (verified today): /home/user/potentially-profitable — 95 HTML files carry <details class="cite">; scripts/build-cost-index-provenance.mjs, build-cost-index-reproduce.mjs, build-cost-index-dispatch.mjs:845 'Cite this edition'