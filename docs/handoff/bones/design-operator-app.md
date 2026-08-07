# The Operator Experience — the product surfaces at app.muntin.digital (`apps/web/app/(product)/`, 54 routes)

## Thesis
The operator does not log in to learn their food cost — they open an email. Everything about the current app assumes a daily-return SaaS relationship that a monthly deliverable cannot support, and the copy admits it: `/today` says "Three things tonight" (`apps/web/lib/copy.ts:379`) while the only scheduled operator contact in the system fires on Tuesdays (`apps/api/wrangler.toml:260` → `apps/api/src/index.ts:627`). A product sold as a signed monthly close has exactly three operator jobs — feed the pipe, count once, clear exceptions — and none of them is daily. So the app splits by audience, not by feature: three operator routes, everything else moved behind a role as Don's exception desk. The moment of value is a 7am email on the second Tuesday whose body IS the four legs; the app is where you go when you want the schedules. The second position is harder: the product currently manufactures a statistic it cannot stand behind. `food-cost-client.tsx:30-32` maps a categorical band to 0.9/0.6/0.3 and hands it to `ConfidenceChip`, which prints `${pct}%` (`packages/ui/src/ConfidenceChip.tsx:81`) — a fabricated percentage on the company's own honesty product, with zero users and therefore zero calibration data. It goes, and coverage replaces it: coverage is measured, and "we answered 87% of purchase dollars and held 13%" is a stronger, more falsifiable claim than any confidence number. The third position is about mass. A withheld number today is a `—` (`food-cost-client.tsx:16`) or an absent leg; two of the four legs of the identity are fetched over the wire and never drawn (`insights/food-cost/types.ts:6-7` declares `beginning_value_cents` and `purchases_value_cents`; neither appears anywhere in `food-cost-client.tsx`). A hole reads as failure. A held position — same slot, same tabular width, same baseline, filled with a reason and a repair path — reads as a decision. That is one CSS component and it is the whole answer to "how does withholding feel like authority." And finally, the aesthetic call: this product should stop looking like a dashboard. The visual language is the working audit binder — a schedule, not a card grid; hairlines, not chrome; Geist Mono decimal-aligned columns with a tickmark legend at the foot. Fraunces is already loaded and sits unused as display (`packages/ui/tokens.css:105-106` sets `--mun-font-display: var(--mun-font-body)`, i.e. Inter, the named AI tell, while `--mun-font-editorial` is Fraunces). The statement — and only the statement — speaks in that serif. One place in the whole product where the machine stops being an app and becomes a document.

## Today
**54 product routes** (`apps/web/app/(product)/**/page.tsx`), of which 33 are `insights/*`, `bookkeeper/*`, `ops` and `settings/*`. SideNav carries 7 entries (`apps/web/app/_components/SideNav.tsx:50-99`): Today, Ledger, Inbox, Insights, Recipes, Yields, Settings.

**The identity does not foot on screen.** `insights/food-cost/types.ts:6-7` declares `beginning_value_cents` and `purchases_value_cents`; grep across `food-cost-client.tsx` returns zero render references. The surface draws Usage, Ending and Net sales as a 3-cell `<dl>` under a `text-5xl` percentage (`food-cost-client.tsx:107-129`). Two of four legs are fetched and discarded.

**A fabricated statistic ships today.** `food-cost-client.tsx:30-32` — `confidenceToNum(c) = high ? 0.9 : medium ? 0.6 : 0.3` — converts a categorical band into a number, which `ConfidenceChip` renders as `${pct}%` (`packages/ui/src/ConfidenceChip.tsx:81`). Same pattern at `count-client.tsx:80-82`. The product prints "90% confidence" from the word "high."

**Structured exceptions are collapsed to one red pill.** `apps/api/src/lib/inventory-reconcile.ts:41-47` defines five typed causes per item (`negative_usage`, `no_valuation`, `not_counted`, `purchases_pending_review`, `no_prior_count`) and `copy.ts:79-83` has plain-English labels for all five. The render layer throws them away: `food-cost-client.tsx:160-165` shows one `Pill variant="rust-solid"` reading "One number does not add up" (`copy.ts:118-119`), naming no item.

**"Show your work" is built and pointed at the wrong reader.** `copy.ts:67-68` + `count-client.tsx:326-423` render a genuinely good per-item drawer — Beginning / Purchases / On hand / Used, valued-at with source attribution, cause list — inside the count flow, which the CPA never opens.

**The capture model is inverted, and the fix is built and hidden.** Primary CTA is "Take a photo" (`copy.ts:1022`, `inbox-client.tsx:874-875` `capture="environment"`). Meanwhile `apps/email-worker/src/index.ts` implements the full `<token>@invoices.muntin.digital` forward path end to end. Grep across `apps/web/app` and `apps/web/lib/copy.ts` finds that address only in a marketing demo fixture (`apps/web/app/(marketing)/demo/tour-data.ts:304`) and in code comments (`copy.ts:3672`). No API route serves an org its own token — `org_inbox_tokens` is read only by the resolver (`apps/api/src/lib/org-inbox-tokens-store.ts:52`). The best channel is unreachable by the operator.

**The count fabricates the tail.** `count-client.tsx:216-228`: every un-entered item is submitted at `expected_base_qty` with `estimated: true`. That is an invented ending quantity, and it makes the tail feel obligatory rather than disclosable.

**The cadence contradicts itself.** `copy.ts:379` "Three things tonight." / `copy.ts:380` "Nothing else needs you tonight." vs. `apps/api/wrangler.toml:260` cron `0 15 * * 2` dispatching `runCostWatchDigest` (`apps/api/src/index.ts:627`), and `0 15 * * 1` for the accountant digest (`:607`).

**Span-level provenance already exists.** `packages/viewer/src/BboxOverlay.tsx` + `/v1/extractions/:id/bboxes?page=N` (`document-client.tsx:666-679`) highlight the invoice region a field came from. It lives only in the document-review flow. Signature infrastructure also exists — `signEnvelopeEd25519` (`apps/api/src/routes/accountant-handoffs.ts:9`).

**ADR-012 (`docs/ux/decisions/ADR-012-the-closed-month-statement.md`, Proposed, 2026-08-07)** already specifies the artifact: four legs printed, residual always shown including at zero, six named withhold conditions, per-line basis tokens, exceptions as rows, versioning + signature + supersession. It is a data/engine spec. It has no interaction design and no operator-facing shell. That is the gap this fills.

**Type scale:** `--mun-font-display` resolves to Inter (`packages/ui/tokens.css:105`); Fraunces is loaded as `--mun-font-editorial` (`:106`) and used nowhere in `(product)`. Radii 4/6/8/10 (`:136-140`), three easing curves (`:152-154`), `tabular-nums` present but `lining-nums` absent everywhere.

## Proposal
## 1. The app is three routes. Everything else is the exception desk.

**`/close`** — the statement, and the operator's home. **`/count`** — the one manual input. **`/exceptions`** — the docket. SideNav drops from 7 to 3. `/today`, `/insights/*` (except food-cost, which becomes `/close`), `/ops`, `/bookkeeper/*`, `/learned-yields`, `/ingredients`, `/integrations`, `/recipes` move under a `/desk` prefix gated on `role === 'owner_operator_of_muntin'` — not deleted, not redirected, just off the operator's map. They are Don's tooling for delivering the service and should be honestly labeled as such.

The CPA never logs in. They receive a URL and a PDF.

## 2. The moment of value is an email, and it is the first thing built.

Resolve the cadence contradiction by decision: **there is no daily operator surface.** One weekly wake (the existing Tuesday cron, `apps/api/src/index.ts:627`), two monthly-phased jobs:

- **First Tuesday, 7am local — "Your count is open."** Subject line carries the dollar target, not a task: `Bethesda — $41,205 in purchases to close out.` Body: the three legs already known, the fourth blank, and one link.
- **Second Tuesday, 7am local — the statement.** The email body **is** the four legs, in a plain-text-safe table. Not a notification pointing at a dashboard — the deliverable itself, readable on a phone at the pass without tapping anything:

```
  MUNTIN — STATEMENT OF FOOD COST
  Tacombi Bethesda · July 1 – July 31, 2026 · v1 · signed 08-12 by D. Goldstein

  Beginning inventory        12,480.00   carried from 06-30 close (v2, signed)
+ Purchases                  41,205.16   88 invoices · 3 exceptions
− Ending inventory           11,940.00   counted 08-02 · 214 of 231 items
  ───────────────────────────────────
= Usage (real COGS)          41,745.16
  Unexplained residual            0.00 ✓

  Food cost                      WITHHELD
  Net sales settled 12 of 31 days. We will not divide by a partial month.
  → Enter July net sales, and this statement recomputes to v2.
```

The withheld line sits in the percentage's slot, at the percentage's type size, with the reason directly beneath and a repair path. That is the whole design thesis in six lines, and it ships as an email template before any screen changes.

## 3. The withheld cell: one component, `<Held>`.

The single most reusable object in the redesign. It occupies the same slot, the same tabular width, the same baseline and the same border as a real value, and fills with three parts (the AVA "reasoned abstention" shape):

- **what is missing** — "Net sales settled 12 of 31 days"
- **why that blocks it** — "We will not divide by a partial month"
- **the one action that clears it** — "Enter July net sales →"

Visually: a 1px dotted left rule in `--mun-border-strong`, the `◇` glyph from `packages/ui/src/trust-glyphs.ts:44` (already defined, already colour-blind-safe, already test-guarded for pairwise distinctness), reason in `--mun-text-secondary` at 13px, the action as a link. Never a dash. Never a spinner. Never "unavailable." Never rust — rust is for exceptions, and a withheld number is not an error.

## 4. The statement itself: a schedule, not a dashboard.

No `Card`. No grid. Full-bleed, max-width 720px, hairline rules only.

- **Type**: `--mun-font-editorial` (Fraunces, already loaded, currently unused in product) at 28/32 for `Statement of Food Cost` and the location/period line — the one serif moment in the entire product. Everything below is Geist Mono at 13/22 with `font-variant-numeric: lining-nums tabular-nums` (the `lining-nums` half is missing everywhere today), right-aligned, decimal-aligned via a fixed cents column.
- **The residual line is always drawn, including at zero**, with a `✓` tickmark. A reader must see that the check ran, not infer it from silence.
- **Tickmarks + legend at the foot of the page**, the CPA's native idiom: `∑` footed · `✓` traced to invoice · `e` estimated at market prior · `◇` not counted · `!` exception, see docket. Costs one superscript and a `<dl>`; prints perfectly; degrades to plain text in the email.
- **Basis-token column** on every line: `Invoice` · `Latest window cost` · `Prior count carry` · `Market estimate` · `Not counted` · `Dollars only`. The `copy.ts:73-76` strings (`sourceWac`, `sourceInvoice`, `sourceCostIndex`, `sourceManual`) exist and are good — they need a column, not a drawer.
- **Coverage, not confidence**, as the line under the identity: *"Answered 87% of purchase dollars. Held 13% ($5,340) across 17 uncounted items."* Coverage is measured. Confidence is not.
- **Semantic zoom** (the one Keyhole-Effect pattern worth the hours): statement → line → the invoice region the line came from. `packages/viewer/src/BboxOverlay.tsx` already renders that last hop; it is currently reachable only from `/document/[id]`. Wiring it to a statement line is a link, not a build.

No chat. No copilot. No generative UI. A close is a statement, not a conversation.

## 5. The count becomes a burn-down against a dollar target.

The count costs $100-150 of floor labor and it is the binding constraint on everything. Two changes shrink it:

**Retire the tail fill.** `count-client.tsx:216-228` invents an ending quantity for every un-entered item. Delete it. Uncounted items are excluded from usage and their exposure is *named in dollars*. This removes count burden (ADR-012's D-02) and removes a fabrication in the same edit.

**Reframe the progress metric from items to dollars.** Today the operator sees "Counted 12 of 47 high-value items" (`copy.ts:33`). Replace with a persistent State Rail at the top of the count screen, the one thing that never scrolls away:

```
  $38,100 of $41,205 explained          $3,105 still uncounted
  ████████████████████████████░░
```

Every entry moves it. The operator sets their own stopping rule in dollars, once, in settings — and the statement discloses whatever they left. That converts an unbounded list into a target the operator chooses, which is the only honest way to shrink a count without lying about it.

Entry mechanics keep what ADR-006 got right: auto-built sheet, station sweep order, pack-unit toggle, Enter advances (`count-client.tsx:153-162`), offline-safe save. One change: one item per screen at thumb height on mobile, keypad occupying the lower half. The current row layout (`count-client.tsx:505-572`) puts a `w-24` input beside truncated text — fine on desktop, wrong in a walk-in with cold hands.

## 6. Exceptions become a docket, one row per cause.

Retire the boolean pill. The engine's five typed causes (`inventory-reconcile.ts:41-47`) each get a row with the failing arithmetic printed inline and a repair path:

```
!  Roma tomatoes, 20 lb case          negative usage
   Beginning 4 cs + Purchases 12 cs − Ending 19 cs = −3 cs
   You counted more than could have been on the shelf. A bill may be
   missing, or the count may be in the wrong unit.
   → Check invoices 08-14 to 08-31   → Re-enter the count

◇  Olive oil, 3 L                     not counted
   $612 of purchases, no ending count. Excluded from usage.
   → Enter a count   → Or accept the exposure
```

Ordered by dollars at risk, never by cause type. Every row carries a document reference where one exists. The `copy.ts:79-83` cause strings are already written and already grade-≤7 — they need rows, not a drawer.

## 7. The front door is an email address, not a camera.

The single highest-leverage unbuilt flow. `/close` day one is not an empty state — it is one copyable line:

```
  Forward invoices here
  inb_8h2pXk4nQ7w2vTzL@invoices.muntin.digital        [Copy]

  Give this to your reps' AP desks once. Then you are done —
  the invoices arrive on their own.

  [Send the ask]   ← opens a pre-written email, one per vendor
```

This needs a `GET /v1/org/inbox-token` route (the table and resolver already exist) and one screen. "Take a photo" (`copy.ts:1022`) demotes to a secondary action for the paper the driver hands over — which is honest, because all seven demo fixtures in `apps/web/public/demo-samples/` are PDFs. The buyer's defining trait is 8-12 specialty distributors; the design should make the *distributors* do the capture, once, forever.

## 8. Motion, density, and what this must not look like.

Two easing curves only — `--mun-ease-default` for state, `--mun-ease-emphasis` for the statement's one entrance — 200ms, transform/opacity, `prefers-reduced-motion` branch mandatory. No scroll-driven animation on any product surface: highest INP cost, zero trust yield.

Explicit blocklist, enforceable as `scripts/check-slop.mjs` in the same family as the existing `check-verboten-phrases.mjs`: Inter as display face, gradient orbs, `backdrop-filter` glass, bento grids, three-icon-card rows, dark-by-default on any statement surface. The app is 80-84% agent-authored; without a mechanical block this is what the next fifty sessions build. A gate is the only form of taste that survives 108 sessions where one carries a CLAUDE.md.

Density is the craft signal here, not whitespace. The statement should look closer to a workpaper than to Mercury.

## Moves
- **Ship the statement EMAIL before any screen change — four legs in the body, withheld line in the percentage's slot with its reason and repair path, plain-text-safe table. Reuse the existing email pipeline (`apps/api/src/lib/email.ts`, already used by `runCostWatchDigest`).** [3-4 founder-hours (review + send). Agent writes the template.]
  - It is the deliverable. An operator who never logs in still gets the whole product. It is also the cheapest possible test of the withholding thesis: if the first close prints WITHHELD and the operator does not churn, the strategy survives; if they do, that is a day-60 kill signal and better learned from an email than from a quarter of UI work.
- **Draw all four legs. `insights/food-cost/types.ts:6-7` already carries `beginning_value_cents` and `purchases_value_cents`; render them, add the always-present residual line with a `✓` tickmark, delete the `text-5xl` percentage (`food-cost-client.tsx:107`) and the three-cell `<dl>` (`:114-129`).** [2 founder-hours]
  - The company's central claim is 'every leg foots.' A leg that is fetched and discarded cannot be said to foot. The API already returns everything — this is a render-layer change with zero new endpoints, and it is the difference between a dashboard and a statement.
- **Delete `confidenceToNum` (`food-cost-client.tsx:30-32`, `count-client.tsx:80-82`) and remove `ConfidenceChip` from every aggregate surface. Replace with the coverage line in dollars: 'Answered 87% of purchase dollars. Held 13%.' Keep the chip on per-field extraction reads, where the score is a real model output.** [2 founder-hours (+1 API hour to make coverage dollar-weighted rather than item-weighted)]
  - The product currently converts the word 'high' into '90%' and prints it. That is a fabricated statistic on the honesty product, with zero users and therefore zero calibration data. Coverage is measured; confidence is not. This is the one change that would be self-refuting to skip.
- **Build `<Held>` — the withheld-cell component. Same slot, same tabular width, same baseline; dotted left rule; the `◇` glyph from `trust-glyphs.ts:44`; three-part body (missing / why / one action). Use it for every null on every surface.** [3 founder-hours]
  - One component that makes withholding read as authority instead of failure, everywhere at once. The vocabulary is already built and test-guarded — this is assembly, not invention. It is also the reusable answer to the AVA finding that abstention without a repair path reads as limitation.
- **Serve the org's forwarding address. Add `GET /v1/org/inbox-token` (table + resolver exist at `apps/api/src/lib/org-inbox-tokens-store.ts`), put it at the top of `/close` with a Copy button and a pre-written vendor-ask email, and demote 'Take a photo' (`copy.ts:1022`) to secondary.** [3 founder-hours]
  - The entire email-forward path is built (`apps/email-worker/src/index.ts`) and the operator can never learn their own address — it appears only in a marketing demo fixture. The buyer's defining trait is 8-12 specialty distributors; making their AP desks do the capture once is the highest-leverage flow in the product and it costs one route and one screen.
- **Retire the count's tail fill (`count-client.tsx:216-228`) and replace the item-count progress line (`copy.ts:33`) with a dollar burn-down State Rail: '$38,100 of $41,205 explained · $3,105 uncounted'. Uncounted items are excluded from usage; the exposure is named on the statement.** [4 founder-hours]
  - Deletes a fabricated ending quantity and REDUCES the count burden in the same edit — the only kind of change that passes ADR-012's count-burden rule. Converts an unbounded item list into a dollar target the operator chooses to stop at, which is the honest way to shrink a $100-150 monthly labor cost.
- **Replace the boolean flag pill (`food-cost-client.tsx:160-165`) with the exception docket — one row per typed cause from `inventory-reconcile.ts:41-47`, the failing arithmetic printed inline, ordered by dollars at risk, each with a repair path. Delete `copy.ts:62-63` and `:118-119`.** [4 founder-hours]
  - The engine emits five structured causes and the UI throws them away for one red pill that names nothing — an exception drawn as an undifferentiated alarm reads as a defect. Rows read as an auditor's 'except for', which is the most authoritative sentence in the profession.
- **Cut SideNav from 7 entries to 3 (`SideNav.tsx:50-99`): Close, Count, Exceptions. Move `insights/*`, `ops`, `bookkeeper/*`, `learned-yields`, `ingredients`, `integrations`, `recipes` under a `/desk` prefix gated on the founder role. No redirects, no deletions.** [3 founder-hours]
  - 33 of 54 product routes are service-delivery tooling shown to a buyer who logs in three times a month. Naming them honestly as the exception desk stops them competing for the operator's attention and stops future sessions maintaining them as operator surfaces. Cheapest possible reduction in perceived and actual surface area.
- **Retire `/today` as a daily feed — 'Three things tonight' (`copy.ts:379-383`), `TodayKpiStrip`, `WhileYouSleptCard`. Repurpose the existing Tuesday cron (`apps/api/src/index.ts:627`) into two monthly-phased sends: first-Tuesday count-open, second-Tuesday statement.** [3 founder-hours]
  - Resolves the cadence contradiction by decision rather than letting two artifacts keep disagreeing. A monthly product with a daily home page teaches the operator to expect daily value it cannot deliver, and every quiet day reads as the product being empty. One cron already exists and already runs on Tuesday.
- **Set `--mun-font-display` to Fraunces for the statement header only (`packages/ui/tokens.css:105`), add `lining-nums` alongside every existing `tabular-nums`, and add the tickmark legend block. Rebuild the statement with hairlines and no `Card` chrome.** [2 founder-hours]
  - Inter-as-display is the single most-named AI tell and Fraunces is already loaded and unused in the product. One serif moment on the one artifact that is a document rather than an app is a legible point of view executed once — which is the whole differentiator the craft research identifies. `lining-nums` is one property applied everywhere numbers appear and most competitors get it wrong.
- **Link statement lines to their invoice region — reuse `packages/viewer/src/BboxOverlay.tsx` and `/v1/extractions/:id/bboxes?page=N` (`document-client.tsx:666-679`) from a statement line rather than only from `/document/[id]`.** [2 founder-hours]
  - Span-level provenance is the frontier's hardest trust move and it is already built here. A CPA's test of a statement is whether any figure walks to its source in under a minute; this makes that walk end on the actual pixels of the actual invoice, which no citation-UI competitor can match.
- **Write `scripts/check-slop.mjs` — blocks Inter as display face, gradient backgrounds, `backdrop-filter`, bento grid classes, three-icon-card rows, dark-by-default on statement surfaces — and wire it into `ci.yml` in the same commit, per the repo's gate-coverage rule.** [2 founder-hours]
  - The app is 80-84% agent-authored. Design rules that live in a document do not survive 108 sessions where one carries a CLAUDE.md; a gate does. This is the same mechanism as the existing `check-verboten-phrases.mjs`, applied to the visual layer.

## Retires
- `/today` as a daily verdict feed — `copy.ts:378-383` ('Three things tonight', 'Nothing else needs you tonight', 'We could not load tonight's review'), `TodayKpiStrip`, `WhileYouSleptCard` and `shouldRenderCard` (`today-client.tsx:159-171`). A monthly product has no daily home page.
- `confidenceToNum` at `food-cost-client.tsx:30-32` and `count-client.tsx:80-82`, plus every `ConfidenceChip` on an aggregate surface (`food-cost-client.tsx:131-134`, `:185-188`, `count-client.tsx:293-296`). The chip stays only where a real model confidence score exists — per-field extraction reads.
- The `text-5xl` headline percentage in all three places it appears: `food-cost-client.tsx:107`, `count-client.tsx:285`, `count-client.tsx:621`. Genre-wrong for a reader looking for a reason to reject the number.
- The three-cell summary `<dl>` at `food-cost-client.tsx:114-129` — replaced by the four-leg identity block, not supplemented by it.
- The boolean `reconciliation_flag` Pill (`food-cost-client.tsx:160-165`, `:182-184`, `count-client.tsx:301-306`) and its copy keys `flagTitle`/`flagBody` at `copy.ts:62-63` and `copy.ts:118-119` — deleted, not kept alongside the docket, in both EN and `copy.es.ts`.
- The count's expected-on-hand tail fill (`count-client.tsx:216-228`) — a fabricated ending quantity labeled as an estimate. Uncounted items are excluded and their dollar exposure is disclosed instead.
- The item-count progress line `copy.ts:33` ('Counted {done} of {total} high-value items') — replaced by the dollar burn-down.
- 'Take a photo' as the primary capture CTA (`copy.ts:1022`, `inbox-client.tsx:911`) and `welcomeTitle`/`welcomeBody` ('Point your camera at any invoice', 'One photo. We read it in about ten seconds.', `copy.ts:1034-1035`). All seven demo fixtures are PDFs; the buyer's vendors email invoices.
- `showWorkTitle`/`showWorkLead` (`copy.ts:67-68`) move OUT of the count result (`count-client.tsx:326-362`) onto the statement — moved, not duplicated. The drawer's contents become the statement's per-line basis column.
- Four of seven SideNav entries (`SideNav.tsx:50-99`): Ledger, Insights, Recipes, Yields leave the operator rail. 33 routes move under `/desk` behind the founder role — frozen in place, URLs preserved, no redirects.
- The name collision: `bookkeeper/statements` (bank/vendor statement reconciliation) renames to `bookkeeper/reconciliations`, so 'Statement' means exactly one thing in this product.
- Any roadmap line for chat, copilot, or generative UI in the operator app. A closed month is a fixed, dated, addressable document — the Keyhole-Effect argument says a conversation degrades exactly the state-dependent work a close is.

## Risk
**The honest failure mode: the first real close almost certainly prints WITHHELD, and this design makes that maximally visible on purpose.** ADR-012 §Consequences says so plainly. A design that gives the withheld number the same type size, the same slot and more explanatory mass than a real number is betting that an owner paying $600/location/month reads that as rigor. The AVA research says user reaction to abstention is genuinely split — some read honesty, some read limitation — and the repair path is what separates them. That is a bet, not a finding, and it is untested here: **zero confirmed users have reacted to a single printed number in this product's history.** If the bet is wrong, the failure is not cosmetic; it is that the product's central move looks like the product not working, and no amount of typography fixes it.

Three narrower risks. **(1) Moving 33 routes behind a role is only cheap if the role check is cheap.** If `/desk` gating requires touching auth in a way that breaks the existing `requireAuth` contract, the move is not 3 hours and should be deferred to a nav-only change (drop the SideNav entries, leave the URLs reachable). **(2) The dollar-weighted coverage number requires an API change** — today `coverage_counted_items` is an item count (`insights/food-cost/types.ts:17-21`), and item coverage is a weaker and slightly dishonest proxy for dollar coverage. Shipping the coverage line before that change would mean printing a number that sounds dollar-shaped and is not; the line must say "items" until the API says dollars. **(3) The Fraunces display call is the one genuinely arguable aesthetic decision here.** A serif on a financial statement is either the thing that makes the artifact feel like a document rather than a screen, or it is costume — and I cannot tell which from a container with no browser. It is one token line and reversible, which is the only reason it is in the plan rather than in a proposal.

Finally, the capacity risk. These twelve moves sum to roughly 33 founder-hours against a floor of 13/month. **That is more than a month even at the ceiling.** The sequence is not optional: moves 1-4 (email, four legs, kill the fabricated percentage, `<Held>`) are one month and are self-contained; everything else waits. Shipping half of this list is fine. Shipping the statement email and still printing "90% confidence" underneath a three-tile dashboard is worse than shipping nothing, because it would put the company's one falsifiable-and-false number directly next to its strongest honest claim.