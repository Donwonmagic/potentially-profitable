# The Storefront Experience — muntin.digital, all 1,327 pages, end to end

## Thesis
Muntin sells a dated document, so the storefront should be published as one — not as a website that describes a document. That is the whole position, and it resolves the founder's three unresolved tensions at once. "Emotionless" was never a pigment problem; the site is emotionless because nothing on it is *about the reader's money*. The homepage of the company whose brand is not printing numbers it cannot stand behind currently opens with a hero instrument labelled `illustrative`, animating a fake `+0.6%` count-up (index.html:504-548) — while `data/cost-index.json` holds 100 real ingredients, a weighted 16-contributor basket, per-point provenance and confidence bands. The emotional pivot ("about the operator, not about us") and the trust mandate are the same move executed once: hand the operator a working professional instrument on the first screen instead of an argument about our integrity. The empowerment the founder wants is not a feeling you can write copy toward — it is what a person feels holding a document their vendor rep cannot argue with. And the single most differentiated asset in the company is already on disk and published nowhere: `coverage.gaps` in `data/cost-index.json` carries **42 ingredients Muntin refuses to price, each with a written reason** ("no free per-cut lamb wholesale price"; "USDA AMS terminal reports carry only a generic Mushrooms commodity") — grep for those strings across all 1,327 HTML pages returns **zero**. The frontier calls this reasoned abstention and treats it as the hardest trust signal available; Muntin built it, then hid it. So: retire every page that argues we are honest, and instead print the 42 things we will not say, dated, with reasons, above the fold. The register that follows is a printed statistical bulletin, not SaaS marketing — rules instead of cards, tabular lining figures everywhere a number appears, mono micro-caps for structure, and a typographic law nobody in restaurant software has: **Fraunces sets verdicts, Inter sets evidence, mono sets structure.** This is buildable at 13-26 h/month only because the leverage is in six generator scripts and one stylesheet, not in 1,327 pages.

## Today
MEASURED TODAY, in-repo.

**The hero is a fabrication in the most load-bearing slot.** `index.html:504-530` is `<figure class="ci-inst">` with `<span class="ci-inst__state">illustrative</span>`, three invented rows (Onion up 14.6%, Ribeye down 2.4%, Chicken breast down 3.8%) and a "sample basket" of `+0.6%`; `index.html:533-548` animates the count-up over 1000ms. Meanwhile `data/cost-index.json#basket` holds a real read of **−0.53%, 16 of 16 declared contributors, agreement 0.505, confidence medium, asOf 2026-06-01**, with real movers (onion +34.4%, russet potato +28.3%, eggs −14.4%, butter −8.4%).

**The abstention register exists and is invisible.** `data/cost-index.json#coverage` = `{measured: 177, derived: 12, absent: 42}` with 42 written `gaps[].reason` strings. `grep -rln 'Honestly absent' --include='*.html' .` → **0 files**. The same pattern repeats with the falsifier: `Muntin-Invoice-Decoder/scripts/no-llm-ci.sh` exists (4,557 bytes, executable); **89** storefront index.html files contain "no language model"; **0** name the script.

**The design languages are already one — the fork is decorative, not structural.** `assets/site.css:1` and `packages/ui/tokens.css` are hash-locked byte-identical by `check-tokens-sync.mjs` (design-inventory.json `tokens.manifest.identical: true`). What actually forks is a **"Golden Hour" expressive layer** at `assets/site.css:3-46` — `--light-marigold:#FFB020`, `--light-coral:#FF6B5C`, `--gradient-goldenhour`, plus `.hero::after` and `.window::after` radial washes and a `warmth.js` runtime that leans the page warmer at dusk. Warm decoration on a financial instrument, added to answer "emotionless" with pigment.

**A re-pigment would change almost nothing.** design-inventory.json: **36,121 raw hex literals** (19,333 on-palette = right colour, wrong mechanism; 16,788 off-palette across 276 distinct colours in 758 files); **6,442 near-misses within 12 RGB of a real token** — the top one, `#ed9a8e` (~`#f5988f`, d=11), appears **4,324 times across 280 files, all emitted by `scripts/build-cost-index-pages.mjs`**. **979 of 1,327 pages re-declare the token palette** in their own `<style>` block (2,165 blocks, 10,868 token declarations in HTML, 14,100 `style=""` attributes). **240 distinct font-size values, 51,899 px literals** — there is no type scale, only a list. Shipped CSS is 19,343 lines of which **9,247 are generated duplicates** across `site-article.css` / `site-core.css` / `site-tool.css`.

**The modern-CSS floor is entirely unused.** Across `assets/*.css`: `oklch` **0**, `@layer` **0**, `@container`/`container-type` **0**, `view-transition` **0**. Present: `:has()` 34, `tabular-nums` 120, `prefers-reduced-motion` 87, `backdrop-filter` **28** (glassmorphism — a named AI tell). `lining-nums` **0**.

**The accent the founder-vision proposes fails contrast.** Computed: `#3b68f5` on `#F6F7F8` = **4.37:1** (fails WCAG AA 4.5 for normal text); on `#FFFFFF` = 4.68. Current `#2A50C8` = **6.36:1**. On the product's own dark base `#101113`, `#3b68f5` = **4.03:1**. "Unify on electric blue" as written breaks AA on the storefront.

**Navigation is a content site's, not a qualification surface's.** `_includes/nav.html:52-62`: Library / Cost Index / Open data / Tools / Company / Ledger, plus auth, search, lang, theme. Six peers, none of which is what the company sells.

**The mass.** `data/surface-inventory.json`: 1,327 pages (676 EN / 651 ES); 1,066 indexable, 261 noindex, **126 orphans**; **775 pages carry a subscribe form** and only **4** carry a waitlist form; **274 emit analytics**; `ctaTargetFrequency` shows **396 + 8 + 4 = 408 CTAs to `ledger.muntin.digital`**, a host neither repo routes, across **402 files**. Retired-line: 3,611 hits, 270 pages over threshold-3, 103 of them indexable — and the **worst indexed page on the site is the `/glossary/` hub itself at score 35**, linked from 312 pages. `/changelog/`, linked from 321 pages and classified `keep · R1-audit-file`, has no entry after **2026-06-27** (41 days stale today).

**`brand/` is 206.9 MB / 1,328 files**, 90 orphaned (11.15 MB), 128 OG card files on disk that `brand/og/cards.json` does not declare.

**The disposition already exists and is good.** `data/surface-disposition.json`: keep 406 · freeze 469 · freeze-noindex 438 · merge 0 · delete 14 (the 14 being the EN+ES marketing sheet pack). It already computes `analyticsTagsToRemove: 221`, `audioTracksReleased: 100`, `wordsFrozen: 779,997`. `_toBuild` names 8 routes that do not exist on disk, including `/close/`, `/close/apply/` and `/cost-index/refusals/`.

## Proposal
## THE POSITION: publish the site as an edition, not as a website

Muntin's product is a signed, dated statement. The storefront is built from the same components as that statement, so a prospect learns what a closed month *feels like* by reading the site. This is the differentiation, the emotional engine and the trust architecture in one decision — and it is cheap, because the components are one stylesheet and the data is already on disk.

### 1. The masthead (site-wide, replaces the nav bar's job)

A hairline band above the nav, on every one of the 406 maintained pages, injected at build from `data/cost-index.json`:

```
MUNTIN                    AS OF 2026-08-04 · MEASURED 177 · DERIVED 12 · WITHHELD 42
```

Mono, 10.5px, `letter-spacing:.1em`, uppercase, `--stone`, one `1px solid var(--line-dark)` under it. This is the **risk-coverage curve as chrome**. It is measured, not estimated, so it survives the fact gate. No competitor can print this line because no competitor withholds.

Nav collapses **6 items → 4**, each being a reader's question:

| Item | Route | Answer |
|---|---|---|
| **The Close** | `/close/` | what we sell (absorbs `/ledger/`, 603 inbound) |
| **The Index** | `/cost-index/` | the published basis (306 pages, tools nest under it) |
| **Check us** | `/check/` | the CPA's door — one page, replaces 26 |
| **Archive** | `/library/` | 492 pages, relabelled and dated read-only |

`Company` (`/studio/`), `Open data` (`/open/`, 619 inbound — keep the URL) and `Glossary` move to the footer. Search stays (⌘K is already built and good). Theme toggle stays.

### 2. The homepage, in order — ISA 700 descending commitment

**(a) THE VERDICT.** One sentence, Fraunces 500, `clamp(28px, 3vw, 44px)`, max 20 words, generated from the live edition:

> *The basket read −0.5% against its own baseline. Onion ran +34%; eggs eased −14%.*

Under it, one line of Inter at `--fs-lead`, `--ink-soft`: *A read against each ingredient's own baseline window. Never your delivered price.* This is the honesty contract stated once, quietly, as the founder's pivot demands — not a section, a subtitle.

**(b) THE INSTRUMENT.** The real basket as a bulletin table, full measure, no card, no shadow, no radius. Columns: `INGREDIENT · WEIGHT · READ · MARK`. Right-aligned `font-variant-numeric: lining-nums tabular-nums`. Hairline `--line` between rows, `--line-dark` under the header and above the derived line. Signed values on `viz-diverge` semantics — side carries direction, colour reinforces (rule 9 of `check-article-graphics.mjs` already enforces this everywhere else on the site; the homepage is currently exempt because its figure is fake).

Tickmarks in the MARK column, superscript, with a legend block beneath the table:
```
∑  footed — contributions re-summed to the basket read
✓  traced — resolves to a named public series
e  estimated — derived, not measured
⊘  withheld — no defensible public source (reason given)
```
This is the CPA's native idiom, it prints, it needs no JS, and it is one CSS component.

**(c) THE HELD ROWS — the aesthetic and strategic centrepiece.** Directly continuous with the instrument, same table, same rules, no visual break:

```
WITHHELD                                                          42 series
Leg of lamb          —   ⊘  No free per-cut lamb wholesale price; LMR is volume-only.
Whole branzino       —   ⊘  Thin/absent in NOAA FOSS; a daily quote needs a paid reporter network.
Oyster mushroom      —   ⊘  AMS terminal reports carry only a generic "Mushrooms" commodity.
                                                            All 42, with reasons →
```

**The held cell keeps its slot, its tabular width, its baseline and its rules, and fills with a reason instead of a dash.** A hole reads as failure; a held position reads as a decision. Every held row carries the three-part shape the AVA research says separates authority from limitation: what is missing, why it blocks the number, and — where one exists — the repair. This one component, `.held`, is the visual translation of the entire company thesis, and it costs about forty lines of CSS.

**(d) WHAT A CLOSE IS.** Three sentences of plain prose at `--measure`, no cards, no icons, no bento. What it guarantees (the four legs foot), what it withholds, what it costs ($600/location/month, hand-invoiced, ADR-030). Then the qualification link.

**(e) THE FALSIFIER BAND.** Full-bleed, `--section-alt`, one hairline top and bottom. Mono, selectable, with a copy button:

```
$ git clone … && ./scripts/no-llm-ci.sh
```
> *No language model reads your invoices. This is the build gate that proves it — run it yourself.*

Per the Wise principle: the proof goes **inside** the claim, not beside it. Today 89 pages make this claim and 0 carry the command.

**(f) QUALIFY.** `/close/apply/` — five questions. Retires the 4 waitlist forms and all 775 subscribe forms.

**No hero image. No card grid. No logo strip. No FAQ accordion. No testimonials.** The current homepage has stances / tool-cta / trust-strip / library / recently-added / founding / services / about / faq / contact — ten sections. The new one has six and the first three are one continuous table.

### 3. The typographic law — three faces, three jobs, gateable

- **Fraunces** (already self-hosted, variable, 36.6KB, CLS-guarded — keep it, it escapes the Inter monoculture) sets **verdicts only**: the dateline, the finding sentence, the exception headline. Not marketing headlines. In bulletin typography the serif carries the opinion and the sans carries the evidence; this is a real convention, it is free, and nobody in restaurant software has it.
- **Inter** sets all evidence: body, tables, labels, forms.
- **Mono** sets structure: micro-caps column headers, the masthead, marks, commands.

Every numeric cell gets `font-variant-numeric: lining-nums tabular-nums` and `text-align: right`. Currently `lining-nums` appears **0 times** in the entire stylesheet.

### 4. Colour — one accent name, two tuned values

`--accent` = `#2A50C8` on light (6.36:1, AA-safe) and `#3b68f5` on dark (the product's own accent, correct at low luminance). **Same token name in both repos** — today `check-tokens-sync` locks a manifest in which zero shared names agree on value. This is the honest unification the founder-vision asked for, corrected by measurement: "unify on electric blue" as literally written puts a 4.37:1 accent on a document a CPA reads.

Ramps re-derived in **OKLCH** with hex fallbacks — but **only after the mechanism moves** (see moves 8-9). A token edit today reaches 0 of the 36,121 hex literals.

**Retire the Golden Hour layer entirely** (`assets/site.css:3-46`, `.hero::after`, `.window::after`, `warmth.js`). It was an attempt to answer "emotionless" with warmth. The correct answer to "emotionless" is consequence.

### 5. Motion and dark

Keep `--ease-out: cubic-bezier(.16,1,.3,1)` and all 87 reduced-motion branches. Delete the count-up. One transition: `background-color`/`border-color` at 180ms on row hover. Add cross-document view transitions as one at-rule — a static multi-page site gets native page continuity for zero JS (verify against caniuse before shipping; the support claim in the brief is secondary-sourced). Decline scroll-driven animation: highest INP risk, lowest trust yield. Dark stays OS-default with an explicit toggle, tuned independently (base L≈10%, elevation by lightness not shadow) — light stays the storefront default, because dark-by-default is on the AI-tell list and the CPA reads in daylight.

### 6. The two readers, one artifact

**The owner** (90 seconds, arrived from their bookkeeper): masthead → verdict → instrument → held rows → what a close is → apply. Leaves believing: *they can see my costs before I can, and they will not bluff me.*

**The CPA** (40 minutes, checking): the same page read to its depth. Verdict → basis (the coverage line resolves to `/cost-index/coverage/`) → exceptions (all 42 held, with reasons) → schedules (per-ingredient `series.csv`, `sources.json`, versioned `methodology.json`, the CC0 snapshots) → `/check/` (the runnable falsifier, the corrections register, the 136 gates and what each blocks). Leaves believing: *the number resolves to a federal series I can pull myself, and they publish what they got wrong.*

One document, two depths, no second site. That is what ISA 700 ordering buys.

## Moves
- **Kill the illustrative hero. Delete `<figure class="ci-inst">` (index.html:504-530) and the count-up script (index.html:533-548). Replace with a build-time-injected verdict sentence + the real 16-contributor basket table from `data/cost-index.json#basket`, plus the tickmark legend. Add `check-no-illustrative-numbers.mjs` asserting no page labelled `illustrative` sits above the fold on a `keep` surface.** [3h founder review; agent-built. One HTML section + one injector in the existing sentinel pattern.]
  - The honesty company's most-read slot currently animates a fabricated +0.6% while a real, weighted, sourced −0.53% read sits unused in `data/cost-index.json`. This is the single largest credibility defect on the property and the fix ships data that already exists. It is also the homepage's whole emotional argument: a real number about the reader's money.
- **Publish the 42 refusals. Build `/cost-index/withheld/` from `coverage.gaps[]` — one held row per ingredient, verbatim reason, no editorializing — and put `WITHHELD 42` in the site masthead linking to it. Ship the `.held` component (slot kept, tabular width kept, rules kept, reason instead of a dash).** [2h. One generator reading an existing JSON key; ~40 lines of CSS.]
  - Zero of 1,327 pages carry these strings today. It is the strongest trust artifact in either repo, it is measured rather than claimed, it needs no new data, and it is the one thing a funded competitor structurally cannot copy. It also converts the site from arguing honesty to exhibiting it, which is exactly the founder's emotional pivot.
- **Ship the masthead band site-wide via `_includes/nav.html` — wordmark, `AS OF <date>`, `MEASURED/DERIVED/WITHHELD`. Cut the nav from 6 items to 4 (The Close · The Index · Check us · Archive); demote Company, Open data and Glossary to the footer; relabel `/library/` as Archive with a dated read-only masthead.** [2h. One shared partial + a footer edit; propagates through the existing chrome-strip build.]
  - The nav is a content site's and the site's job is qualification. Relabelling the Library as a dated archive retires an obligation rather than breaking a promise — 477 of 492 library pages are already `freeze`/`freeze-noindex` in the disposition, and an undeclared stale archive reads worse than a declared one. The `/glossary/` hub is the worst indexed page on the site (retired-line score 35) and is currently a nav peer.
- **Collapse the 26 trust pages into one `/check/` page carrying the runnable falsifier (`no-llm-ci.sh`), the coverage figure, the corrections register and the gate list. Freeze-noindex 24 of them at their URLs; keep `/privacy.html` and `/security/` live for legal reasons. Put the falsifier command inline in the 89 pages that make the claim, or delete the claim from pages that cannot carry the proof.** [4h. One new page; one scripted freeze pass; slugs stay, so no redirect debt.]
  - 89 pages assert 'no language model reads your invoices'; 0 name the 4,557-byte script that proves it. The Tow Center finding is that citation presence raises trust without earning it — the counter-pattern is a claim a stranger can execute. And 26 pages arguing we are trustworthy is precisely the self-defending posture the founder retired.
- **One scripted pass over the retired estate: repoint 408 CTAs across 402 files off `ledger.muntin.digital` to `/close/apply/`; strip the subscribe form from 775 pages down to zero; remove the 221 analytics tags the disposition already enumerates; delete the 14 `delete`-classed sheet pages with 301s.** [3h, one script, agent-executed. The lists are already machine-readable.]
  - The most common interactive element on the site — 402 pages' worth — goes to a host neither repo routes. A CPA hits it in the first two minutes of the forty this strategy banks on. It is a scripted pass, not a judgement call, and `data/surface-disposition.json` has already computed every target list.
- **Ship the bulletin component set in `assets/site.css` and retire the Golden Hour layer in the same commit: `.stmt` (the instrument table), `.held` (the withheld row), `.marks` (the tickmark legend), `.dateline`. Delete `--light-marigold`/`--light-coral`/`--gradient-goldenhour*`/`--glass-warm`/`--gh-eve`, `.hero::after`, `.window::after` and `warmth.js`.** [3h. Net-negative line count.]
  - Adding to the design system requires retiring from it in the same commit — the working-set rule applied to CSS, and the only mechanism that has ever forced this company to retire anything. Golden Hour is warm decoration on a financial instrument and was an attempt to answer 'emotionless' with pigment. The four new components carry the whole visual thesis; `.lib-idx` (site.css:468-493) is already 80% of `.stmt` and is the best-built thing in the stylesheet.
- **Codify and gate the typographic law: Fraunces on `.verdict`/`.dateline` only, Inter for evidence, mono for structure; `font-variant-numeric: lining-nums tabular-nums` + right-alignment on every numeric cell. Add `check-numeral-typography.mjs` and extend it into the product repo's number surfaces.** [2h. One gate in the existing `check-*.mjs` family, wired into `check-all`.]
  - Craft that lives in a document does not survive 108 sessions where 1 carries a CLAUDE.md; craft that lives in a gate does. `lining-nums` appears 0 times in 19,343 lines of CSS today. Alignment is not decoration in a money product — it is what lets an owner scan a column and catch the outlier, and it is the cheapest legible-craft signal available.
- **Fix the six generator scripts, not the 979 pages. `build-cost-index-pages.mjs` alone emits `#ed9a8e` 4,324 times across 280 files; `build-ingredient-yield-pages.mjs`, `build-tools-index.mjs`, `lib/cost-research.mjs`, `lib/event-exposure.mjs` and `migrate-warm-palette.mjs` account for most of the rest. Make them emit `var(--token)` and stop re-declaring the palette in per-page `<style>` blocks. Add `check-hex-literals.mjs` with a frozen baseline that can only ratchet down.** [4h. The highest-leverage hour in the plan and the precondition for every colour decision after it.]
  - 36,121 raw hex literals and 979 pages re-declaring tokens mean a token-level redesign changes almost nothing visible — sequencing is forced: mechanism first, pigment second. The leverage is six files, not a thousand pages, and the ratchet gate means the number can never grow again at agent speed.
- **Collapse the three generated CSS shells (9,247 duplicated lines) into one stylesheet under `@layer reset, tokens, components, utilities`, and introduce a real type scale (`--fs-*` steps) to replace 240 distinct font-size values. Then, and only then, re-derive the ramps in OKLCH with hex fallbacks and set `--accent` to two tuned values (#2A50C8 light / #3b68f5 dark) under one name in both repos.** [3h, and it must come after move 8 or it is wasted.]
  - Cascade layers end the specificity wars that produced 979 pages of inline token re-declaration; a named type scale is the only thing that makes typography changeable globally. And the measurement corrects the founder-vision: #3b68f5 on cream is 4.37:1 and fails WCAG AA for normal text, so 'unify on electric blue' as written would ship an inaccessible accent on the page a CPA reads.
- **Add `check-slop.mjs` — a mechanical blocklist in the same family as the product's `check-verboten-phrases.mjs`: no indigo-to-purple gradients, no `backdrop-filter` (28 uses today), no centered-hero-plus-three-icon-cards, no bento grid, no dark-by-default, no Inter as display face.** [1h. Regex gate, wired in the same commit.]
  - 80-84% of commits in both repos are agent-authored, and models regress to the median of their training data absent constraints. Without a mechanical block, the named AI-slop fingerprint is what the next fifty sessions build by default — which is the specific failure mode that would make all of the above evaporate within a quarter.
- **Retire the discovery cargo: stop rebuilding `llms-full.txt` (681KB) and `feed-llm.json` (376KB) on every deploy — keep the small `/llms.txt` as a cheap map, freeze the corpus. Prune the 90 orphaned `brand/` files (11.15 MB) and the 128 OG card files no manifest declares, from a `brand/` directory that is 206.9 MB across 1,328 files.** [1h.]
  - 97% of published llms.txt files received zero requests in the Ahrefs 137k-domain log study, and the bots that do fetch it are coding agents and audit tools — a population this company does not have. `brand/` cannot serve as the source of truth for what the brand looks like while 90 files in it are unreachable. Both are pure maintenance subtraction with no reader-facing cost.
- **Re-format the Cost Index monthly read as a NAMED DATED BENCHMARK TABLE rather than a narrative dispatch: ingredient, unit, level, read-vs-baseline, source, date — one liftable span per row — with the withheld rows in the same table. Keep the prose editor's note; demote it below the table.** [2h of editorial framing on the next monthly edition; no new pipeline.]
  - The one discovery finding with real evidence behind it: primary research earns ~3.3x citation density but almost entirely when packaged as a measurable comparison rather than buried in a story. A dated decaying price series is definitionally unanswerable from parametric memory, so a model that wants it must fetch and therefore cite. This costs editorial framing, not new data, and it does not smuggle traffic back in as an objective — the payoff is being named, not clicked.

## Retires
- THE ILLUSTRATIVE HERO — `index.html:504-530` (`.ci-inst`, 18 class references) and the 16-line count-up script at `index.html:533-548`. Deleted, not supplemented. A fabricated number in the honesty company's hero is the loudest contradiction on the property.
- THE GOLDEN HOUR EXPRESSIVE LAYER — `assets/site.css:3-46`: `--light-marigold`, `--light-coral`, `--light-amber`, `--gradient-goldenhour`, `--gradient-goldenhour-soft`, `--glass-warm`, `--gh-eve`, plus `.hero::after`, `.window::after` and the `warmth.js` runtime. Warm decoration on a financial instrument.
- 24 OF THE 26 TRUST PAGES → one `/check/`. `/trust/`, `/receipts/`, `/claims/`, `/never/`, `/methods/`, `/ai/`, `/status/`, `/system/`, `/changelog/` and their ES mirrors go `freeze-noindex` at their existing URLs (slugs are final-forever; a URL costs nothing, maintenance costs). `/privacy.html` and `/security/` stay live. The site stops defending itself.
- 408 DEAD PRODUCT CTAs across 402 files pointing at `ledger.muntin.digital` — repointed to `/close/apply/`. Plus the `$19` / `$25` / `$60` prices withdrawn by ADR-030 and still printed on 107 + 135 pages.
- 775 SUBSCRIBE FORMS → 0, and the 4 waitlist forms → 1 qualification form at `/close/apply/`. At forty customers ever, qualification IS the funnel; an email capture on 58% of pages is an acquisition-engine artifact of a strategy that has been retired.
- 221 ANALYTICS TAGS (the exact set already enumerated in `data/surface-disposition.json#summary.analyticsTagsToRemove`), leaving 72 instrumented pages per ADR-032.
- THE 14 DELETABLE SHEET PAGES — the EN+ES marketing pack (`daypart-traffic-map`, `holiday-hours-planner`, `photo-refresh-tracker`, `reservation-no-show-log`, `signage-spec-sheet`, `social-content-calendar`, `vendor-contact-sheet`), 8,840 words, plus their entries in `sheets.json`, `sheets.es.json`, `cross-surface-map.json` and the 7 fragments.
- THE `/glossary/` HUB AS A NAV PEER — retired-line score 35, the worst indexed page on the site, `freeze-noindex` per the existing disposition. The ~60 on-thesis cost terms fold into the Index as its definition layer; the 111 web-design terms stay at their URLs, frozen and unlinked from nav.
- `/library/` AS A LIVE SECTION — relabelled Archive, dated read-only. 477 of its 492 pages are already `freeze` or `freeze-noindex`; declaring it retires the obligation instead of quietly missing it.
- TWO OF THE THREE GENERATED CSS SHELLS — 9,247 duplicated lines across `site-article.css`, `site-core.css`, `site-tool.css` collapsed to one layered stylesheet. And the per-page token block on 979 pages, killed at the six generator scripts that emit it.
- FRAUNCES AS A DISPLAY FACE FOR MARKETING HEADLINES — the font stays (self-hosted, variable, CLS-guarded, already loaded) but its job narrows to verdicts and datelines. `var(--font-display)` currently appears 6,293 times.
- `llms-full.txt` (681KB) AND `feed-llm.json` (376KB) as build targets — frozen, no longer rebuilt on deploy. Plus 90 orphaned `brand/` files (11.15 MB) and 128 undeclared OG cards.
- ANY PER-LINE NUMERIC CONFIDENCE DISPLAY, present or planned — replaced by the existing verbal bands already in the data (`medium` 61, `directional` 20, `low` 19) plus a reason. Zero users means zero calibration data; a percentage would be the one falsifiable-and-false number on the site.
- THE 'UNIFY THE TWO DESIGN LANGUAGES' WORK ITEM — measurement closes it. `check-tokens-sync.mjs` already hash-locks a byte-identical manifest across both repos. What remains is one accent value and one display-face job, both handled above.

## Risk
**This design converts every missed cadence into a visible defect on the homepage — and the cadence is already slipping today.**

The masthead prints `AS OF <date>` and the coverage split, and the hero prints the live basket read. That is the source of the design's authority and its entire failure mode. Measured right now: individual ingredient points in `data/cost-index.json` carry `asOf: 2026-08-04`, but `basket.asOf` is **2026-06-01** — 67 days old. Under the current design that staleness is invisible because the hero is fake. Under this design the homepage would print a two-month-old basket date in mono at the top of the page, forever, until someone re-anchors the basket. The company's own greats analysis is blunt about this: *an overdue obligation is a stronger negative signal than a missing one, because it reads as retrenchment* — and `/changelog/`, linked from 321 pages and classified as part of the public audit file, has had no entry since 2026-06-27.

So the honest risk statement is: **I am proposing that the storefront's credibility be made mechanically dependent on a data pipeline that a 13-26 h/month founder must keep fed.** `cost-index-refresh.yml` runs daily and self-heals, but it no-ops without `FRED_KEY`/`BLS_KEY`/`AMS_KEY`, and the basket re-anchor is a human call. If the pipeline lapses, this design does not degrade gracefully — it advertises the lapse in 10.5px mono on 406 pages. The mitigation is a gate, not a promise: `check-masthead-freshness.mjs` should fail CI past a declared lag and the masthead should print `AS OF 2026-06-01 · STALE` rather than a date that merely looks fine, because a visibly stale honest date still beats a fresh-looking fabricated one. But that is a mitigation, not a refutation, and the founder should decide with his eyes open that he is trading a hero that can never be wrong for a hero that can be publicly late.

Two smaller honest limits. First, the whole abstention argument assumes the 42 withholdings are the *right* ones to hold; with zero confirmed users there is no evidence for that, so the site may claim the procedure ('here is the rule by which we hold a number') and must not claim the outcome ('our held lines were correct'). Second, the browser-support claims underneath the cross-document view-transition and container-query recommendations are secondary-sourced in the brief and were not verified against caniuse from this container — nothing load-bearing should ship on them until they are.